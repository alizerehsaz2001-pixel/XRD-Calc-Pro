import sys
import json
import numpy as np
import math
import time
from typing import List, Dict, Tuple

# Detect PyTorch runtime acceleration
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

# Class dictionary mapping identifiers to indexing positions
CLASS_NAMES = [
    "Quartz (Alpha-SiO2)",
    "Rutile (Tetragonal-TiO2)",
    "Anatase (Tetragonal-TiO2)",
    "Halite (NaCl)",
    "Corundum (Alpha-Al2O3)",
    "Silicon Standard (Si-SRM640)",
    "Magnetite (Fe3O4)"
]

# Hardcoded reference standards to ensure script-level independence & atomic-fast access
STANDARDS_DB = [
    {
        "name": "Quartz (Alpha-SiO2)",
        "peaks": [
            {"two_theta": 20.8, "intensity": 35},
            {"two_theta": 26.6, "intensity": 100},
            {"two_theta": 36.5, "intensity": 12},
            {"two_theta": 50.1, "intensity": 14},
            {"two_theta": 59.9, "intensity": 9}
        ]
    },
    {
        "name": "Rutile (Tetragonal-TiO2)",
        "peaks": [
            {"two_theta": 27.4, "intensity": 100},
            {"two_theta": 36.1, "intensity": 50},
            {"two_theta": 41.2, "intensity": 22},
            {"two_theta": 54.3, "intensity": 61},
            {"two_theta": 56.6, "intensity": 19}
        ]
    },
    {
        "name": "Anatase (Tetragonal-TiO2)",
        "peaks": [
            {"two_theta": 25.3, "intensity": 100},
            {"two_theta": 37.8, "intensity": 20},
            {"two_theta": 48.0, "intensity": 35},
            {"two_theta": 53.9, "intensity": 20},
            {"two_theta": 55.0, "intensity": 20}
        ]
    },
    {
        "name": "Halite (NaCl)",
        "peaks": [
            {"two_theta": 27.3, "intensity": 13},
            {"two_theta": 31.7, "intensity": 100},
            {"two_theta": 45.4, "intensity": 55},
            {"two_theta": 56.4, "intensity": 30},
            {"two_theta": 66.2, "intensity": 11}
        ]
    },
    {
        "name": "Corundum (Alpha-Al2O3)",
        "peaks": [
            {"two_theta": 25.58, "intensity": 75},
            {"two_theta": 35.15, "intensity": 100},
            {"two_theta": 37.78, "intensity": 40},
            {"two_theta": 43.36, "intensity": 80},
            {"two_theta": 52.55, "intensity": 45},
            {"two_theta": 57.52, "intensity": 90},
            {"two_theta": 68.21, "intensity": 45}
        ]
    },
    {
        "name": "Silicon Standard (Si-SRM640)",
        "peaks": [
            {"two_theta": 28.44, "intensity": 100},
            {"two_theta": 47.30, "intensity": 55},
            {"two_theta": 56.12, "intensity": 30},
            {"two_theta": 69.13, "intensity": 40},
            {"two_theta": 76.38, "intensity": 12},
            {"two_theta": 88.03, "intensity": 18}
        ]
    },
    {
        "name": "Magnetite (Fe3O4)",
        "peaks": [
            {"two_theta": 18.31, "intensity": 10},
            {"two_theta": 30.11, "intensity": 30},
            {"two_theta": 35.45, "intensity": 100},
            {"two_theta": 43.09, "intensity": 20},
            {"two_theta": 53.49, "intensity": 10},
            {"two_theta": 56.98, "intensity": 30},
            {"two_theta": 62.57, "intensity": 40}
        ]
    }
]

# Convert discrete peaks to a 1D continuous spectral envelope vector
def peaks_to_continuous_vector(peaks: List[Dict[str, float]], grid_size: int = 120, 
                               min_2theta: float = 10.0, max_2theta: float = 90.0, 
                               sigma: float = 0.4, strain: float = 0.0) -> np.ndarray:
    two_theta_grid = np.linspace(min_2theta, max_2theta, grid_size)
    spectrum = np.zeros(grid_size, dtype=np.float32)
    
    for p in peaks:
        # Shift position according to mechanical lattice strain
        pos = p['two_theta'] * (1.0 + strain)
        val = p['intensity']
        
        # Gaussian distribution kernel representational fit
        kernel = np.exp(-0.5 * ((two_theta_grid - pos) / sigma) ** 2)
        spectrum += val * kernel
        
    norm = np.linalg.norm(spectrum)
    if norm > 0:
        spectrum /= norm
    return spectrum

# Generate augmented dataset with physics-based distortions
def generate_augmented_dataset(samples_per_class: int = 60, noise_level: float = 0.1, 
                               background_drift: float = 5.0, strain_range: float = 0.03, 
                               broadening_range: float = 0.3) -> Tuple[np.ndarray, np.ndarray]:
    X_data = []
    y_data = []
    
    np.random.seed(42) # stabilize generation
    
    for class_idx, standard in enumerate(STANDARDS_DB):
        for _ in range(samples_per_class):
            # 1. Random physics-informed augmentations
            sample_strain = np.random.uniform(-strain_range, strain_range)
            sample_sigma = np.random.uniform(0.15, 0.15 + broadening_range)
            
            # 2. Compute 1D continuous base spectrum
            base_vec = peaks_to_continuous_vector(
                standard["peaks"], 
                grid_size=120, 
                sigma=sample_sigma, 
                strain=sample_strain
            )
            
            # 3. Add random detector counting noise
            noise = np.random.normal(0, noise_level * 0.1, size=base_vec.shape)
            augmented_vec = base_vec + noise
            
            # 4. Add random amorphous background hump (simulated polynomial curve)
            x_range = np.linspace(-1.0, 1.0, 120)
            bg_curve = (np.random.uniform(-0.1, 0.1) * (x_range ** 2) + 
                        np.random.uniform(-0.05, 0.05) * x_range + 
                        np.random.uniform(0.02, 0.1))
            augmented_vec += (bg_curve * (background_drift / 100.0))
            
            # Clip negative intensities and normalize area structure
            augmented_vec = np.clip(augmented_vec, 0, None)
            norm = np.linalg.norm(augmented_vec)
            if norm > 0:
                augmented_vec /= norm
                
            X_data.append(augmented_vec)
            y_data.append(class_idx)
            
    return np.array(X_data, dtype=np.float32), np.array(y_data, dtype=np.int32)

# Custom High-Fidelity Numpy MLP Neural Network (Retained for 100% stable fallback)
class NumpyMLPClassifier:
    def __init__(self, input_dim: int, hidden_layers: List[int], output_dim: int, 
                 activation: str = "GELU", dropout: float = 0.0):
        self.weights = []
        self.biases = []
        self.activation_name = activation
        self.dropout_rate = dropout
        
        # Layer dimensions setup
        layers = [input_dim] + hidden_layers + [output_dim]
        np.random.seed(42) # stable initializations
        
        for i in range(len(layers) - 1):
            # He / Xavier initialization
            limit = np.sqrt(2.0 / layers[i])
            self.weights.append(np.random.randn(layers[i], layers[i+1]) * limit)
            self.biases.append(np.zeros((1, layers[i+1])))
            
        # Adam Optimizer buffers
        self.m_w = [np.zeros_like(w) for w in self.weights]
        self.v_w = [np.zeros_like(w) for w in self.weights]
        self.m_b = [np.zeros_like(b) for b in self.biases]
        self.v_b = [np.zeros_like(b) for b in self.biases]
        self.t = 0 # Step counter

    def _activate(self, x: np.ndarray) -> np.ndarray:
        if self.activation_name == "ReLU":
            return np.maximum(0, x)
        elif self.activation_name == "LeakyReLU":
            return np.where(x > 0, x, x * 0.1)
        elif self.activation_name == "GELU":
            return 0.5 * x * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * (x + 0.044715 * (x ** 3))))
        else: # Sigmoid
            return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))

    def _activate_derivative(self, cached_activated: np.ndarray, x: np.ndarray = None) -> np.ndarray:
        if self.activation_name == "ReLU":
            return np.where(cached_activated > 0, 1.0, 0.0)
        elif self.activation_name == "LeakyReLU":
            return np.where(cached_activated > 0, 1.0, 0.1)
        elif self.activation_name == "GELU" and x is not None:
            tanh_factor = np.tanh(np.sqrt(2.0 / np.pi) * (x + 0.044715 * (x ** 3)))
            sech2_factor = 1.0 - tanh_factor ** 2
            internal_derivative = np.sqrt(2.0 / np.pi) * (1.0 + 3 * 0.044715 * (x ** 2))
            return 0.5 * (1.0 + tanh_factor) + 0.5 * x * sech2_factor * internal_derivative
        else: # Sigmoid
            return cached_activated * (1.0 - cached_activated)

    def _softmax(self, x: np.ndarray) -> np.ndarray:
        exp_vals = np.exp(x - np.max(x, axis=1, keepdims=True))
        return exp_vals / np.sum(exp_vals, axis=1, keepdims=True)

    def forward(self, x: np.ndarray, training: bool = True) -> Tuple[List[np.ndarray], List[np.ndarray]]:
        activations = [x]
        raw_inputs = []
        
        current_input = x
        for i in range(len(self.weights) - 1):
            z = np.dot(current_input, self.weights[i]) + self.biases[i]
            raw_inputs.append(z)
            a = self._activate(z)
            
            if training and self.dropout_rate > 0.0:
                mask = (np.random.rand(*a.shape) >= self.dropout_rate) / (1.0 - self.dropout_rate)
                a = a * mask
                
            activations.append(a)
            current_input = a
            
        z_out = np.dot(current_input, self.weights[-1]) + self.biases[-1]
        raw_inputs.append(z_out)
        a_out = self._softmax(z_out)
        activations.append(a_out)
        
        return activations, raw_inputs

    def backpropagate(self, activations: List[np.ndarray], raw_inputs: List[np.ndarray], 
                       y_batch: np.ndarray, lr: float, optimizer: str = "Adam") -> None:
        num_samples = y_batch.shape[0]
        self.t += 1
        
        one_hot = np.zeros_like(activations[-1])
        one_hot[np.arange(num_samples), y_batch] = 1.0
        
        dZ = (activations[-1] - one_hot) / num_samples
        
        for i in reversed(range(len(self.weights))):
            dW = np.dot(activations[i].T, dZ)
            dB = np.sum(dZ, axis=0, keepdims=True)
            
            if i > 0:
                da = np.dot(dZ, self.weights[i].T)
                deriv = self._activate_derivative(activations[i], raw_inputs[i-1])
                dZ = da * deriv
                
            if optimizer == "Adam":
                beta1, beta2, eps = 0.9, 0.999, 1e-8
                self.m_w[i] = beta1 * self.m_w[i] + (1 - beta1) * dW
                self.v_w[i] = beta2 * self.v_w[i] + (1 - beta2) * (dW ** 2)
                m_w_corrected = self.m_w[i] / (1 - beta1 ** self.t)
                v_w_corrected = self.v_w[i] / (1 - beta2 ** self.t)
                self.weights[i] -= lr * m_w_corrected / (np.sqrt(v_w_corrected) + eps)
                
                self.m_b[i] = beta1 * self.m_b[i] + (1 - beta1) * dB
                self.v_b[i] = beta2 * self.v_b[i] + (1 - beta2) * (dB ** 2)
                m_b_corrected = self.m_b[i] / (1 - beta1 ** self.t)
                v_b_corrected = self.v_b[i] / (1 - beta2 ** self.t)
                self.biases[i] -= lr * m_b_corrected / (np.sqrt(v_b_corrected) + eps)
                
            elif optimizer == "RMSprop":
                beta, eps = 0.9, 1e-8
                self.v_w[i] = beta * self.v_w[i] + (1 - beta) * (dW ** 2)
                self.weights[i] -= lr * dW / (np.sqrt(self.v_w[i]) + eps)
                self.v_b[i] = beta * self.v_b[i] + (1 - beta) * (dB ** 2)
                self.biases[i] -= lr * dB / (np.sqrt(self.v_b[i]) + eps)
                
            else: # SGD with momentum
                self.m_w[i] = 0.9 * self.m_w[i] + lr * dW
                self.weights[i] -= self.m_w[i]
                self.m_b[i] = 0.9 * self.m_b[i] + lr * dB
                self.biases[i] -= self.m_b[i]

def train_model(epochs: int = 50, lr: float = 0.005, batch_size: int = 32, 
                optimizer: str = "Adam", architecture: str = "Deep MLP", 
                noise_level: float = 0.1, background_drift: float = 5.0, 
                strain_range: float = 0.02, broadening_range: float = 0.25,
                dropout: float = 0.0, activation: str = "GELU") -> Dict:
    
    start_time = time.time()
    
    # 1. Generate physically augmented training/validation datasets (7 classes)
    X, y = generate_augmented_dataset(
        samples_per_class=60, 
        noise_level=noise_level, 
        background_drift=background_drift, 
        strain_range=strain_range, 
        broadening_range=broadening_range
    )
    
    # Stratified Train/Val split (70% Train, 30% Validation)
    np.random.seed(1337)
    shuffled_indices = np.random.permutation(X.shape[0])
    X, y = X[shuffled_indices], y[shuffled_indices]
    
    split_border = int(0.7 * X.shape[0])
    X_train, y_train = X[:split_border], y[:split_border]
    X_val, y_val = X[split_border:], y[split_border:]
    
    # 2. Select network architecture layers
    if architecture == "Feedforward MLP":
        hidden_dims = [64]
    elif architecture == "Deep MLP":
        hidden_dims = [128, 64]
    else: # "Residual MLP" / Others
        hidden_dims = [128, 128, 64]

    pytorch_trained_successfully = False
    epoch_history = []
    confusion = np.zeros((7, 7), dtype=int)
    weights_dump = []
    biases_dump = []
    val_acc_final = 0.0
    avg_train_loss_final = 0.0
    avg_val_loss_final = 0.0
    train_acc_final = 0.0

    # Try PyTorch First
    if HAS_TORCH:
        try:
            print("[PyTorch Core Initiated] Setting up neural model layers, device tensors, and backprop graphs.", file=sys.stderr)
            
            X_train_t = torch.FloatTensor(X_train)
            y_train_t = torch.LongTensor(y_train)
            X_val_t = torch.FloatTensor(X_val)
            y_val_t = torch.LongTensor(y_val)
            
            def get_pt_activation(act_name: str):
                if act_name == "ReLU":
                    return nn.ReLU()
                elif act_name == "LeakyReLU":
                    return nn.LeakyReLU(0.1)
                elif act_name == "GELU":
                    return nn.GELU()
                else:
                    return nn.Sigmoid()

            # Dynamic sequential neural generator
            class PyTorchSeqNet(nn.Module):
                def __init__(self, input_dim: int, hidden_layers: List[int], output_dim: int, 
                             act_name: str, dropout_rate: float):
                    super().__init__()
                    layers = []
                    prev_dim = input_dim
                    for h_dim in hidden_layers:
                        layers.append(nn.Linear(prev_dim, h_dim))
                        layers.append(get_pt_activation(act_name))
                        if dropout_rate > 0.0:
                            layers.append(nn.Dropout(dropout_rate))
                        prev_dim = h_dim
                    layers.append(nn.Linear(prev_dim, output_dim))
                    self.network = nn.Sequential(*layers)
                    
                def forward(self, x):
                    return self.network(x)

            model_pt = PyTorchSeqNet(
                input_dim=120,
                hidden_layers=hidden_dims,
                output_dim=7,
                act_name=activation,
                dropout_rate=dropout
            )
            
            criterion_pt = nn.CrossEntropyLoss()
            
            # Match optimizer configs
            if optimizer == "Adam":
                optimizer_pt = optim.Adam(model_pt.parameters(), lr=lr)
            elif optimizer == "RMSprop":
                optimizer_pt = optim.RMSprop(model_pt.parameters(), lr=lr)
            else: # SGD
                optimizer_pt = optim.SGD(model_pt.parameters(), lr=lr, momentum=0.9)

            for ep in range(1, epochs + 1):
                model_pt.train()
                # Simulate mini-batch loader
                shuffled_train_idx = np.random.permutation(X_train.shape[0])
                train_losses = []
                train_corrects = 0
                
                for b_start in range(0, X_train.shape[0], batch_size):
                    b_end = min(b_start + batch_size, X_train.shape[0])
                    if b_start == b_end:
                        continue
                    X_batch = X_train_t[shuffled_train_idx[b_start:b_end]]
                    y_batch = y_train_t[shuffled_train_idx[b_start:b_end]]
                    
                    optimizer_pt.zero_grad()
                    out = model_pt(X_batch)
                    loss = criterion_pt(out, y_batch)
                    loss.backward()
                    optimizer_pt.step()
                    
                    train_losses.append(loss.item())
                    preds = torch.argmax(out, dim=1)
                    train_corrects += torch.sum(preds == y_batch).item()
                    
                avg_train_loss = float(np.mean(train_losses))
                train_acc = float(train_corrects / X_train.shape[0])
                
                # Evaluation step
                model_pt.eval()
                with torch.no_grad():
                    val_out = model_pt(X_val_t)
                    avg_val_loss = float(criterion_pt(val_out, y_val_t).item())
                    val_preds_labels = torch.argmax(val_out, dim=1)
                    val_corrects = torch.sum(val_preds_labels == y_val_t).item()
                    val_acc = float(val_corrects / X_val.shape[0])
                    
                epoch_history.append({
                    "epoch": ep,
                    "loss": round(avg_train_loss, 4),
                    "val_loss": round(avg_val_loss, 4),
                    "acc": round(train_acc * 100.0, 2),
                    "val_acc": round(val_acc * 100.0, 2)
                })

            # Calculate final outputs
            avg_train_loss_final = avg_train_loss
            avg_val_loss_final = avg_val_loss
            train_acc_final = train_acc
            val_acc_final = val_acc
            
            # Confusion Matrix
            for true_label, pred_label in zip(y_val, val_preds_labels.cpu().numpy()):
                confusion[true_label, pred_label] += 1
                
            # Copy layer weights for standard JSON sequential inference format
            for layer in model_pt.network:
                if isinstance(layer, nn.Linear):
                    weights_dump.append(layer.weight.detach().cpu().numpy().T.tolist())
                    biases_dump.append(layer.bias.detach().cpu().numpy().reshape(1, -1).tolist())

            pytorch_trained_successfully = True
            print(f"[PyTorch Engine Success] Finished PyTorch training successfully in {time.time() - start_time:.3f}s.", file=sys.stderr)
        except Exception as pt_err:
            print(f"Warning: PyTorch trainer raised error, starting NumPy fallback solver: {pt_err}", file=sys.stderr)
            pytorch_trained_successfully = False

    # Fall back to high-fidelity Numpy solver if PyTorch was not available or raised exceptions
    if not pytorch_trained_successfully:
        model = NumpyMLPClassifier(
            input_dim=120, 
            hidden_layers=hidden_dims, 
            output_dim=7, 
            activation=activation,
            dropout=dropout
        )
        
        epoch_history = []
        
        for ep in range(1, epochs + 1):
            shuffled_train = np.random.permutation(X_train.shape[0])
            X_train_shuf = X_train[shuffled_train]
            y_train_shuf = y_train[shuffled_train]
            
            train_losses = []
            train_corrects = 0
            
            for b_start in range(0, X_train.shape[0], batch_size):
                b_end = min(b_start + batch_size, X_train.shape[0])
                X_batch = X_train_shuf[b_start:b_end]
                y_batch = y_train_shuf[b_start:b_end]
                
                if X_batch.shape[0] == 0:
                    continue
                    
                activations, raw_inputs = model.forward(X_batch, training=True)
                y_pred = activations[-1]
                
                eps_clip = 1e-15
                y_pred_clipped = np.clip(y_pred, eps_clip, 1.0 - eps_clip)
                loss_val = -np.mean(np.log(y_pred_clipped[np.arange(X_batch.shape[0]), y_batch]))
                train_losses.append(loss_val)
                train_corrects += np.sum(np.argmax(y_pred, axis=1) == y_batch)
                
                model.backpropagate(activations, raw_inputs, y_batch, lr, optimizer)
                
            avg_train_loss = float(np.mean(train_losses))
            train_acc = float(train_corrects / X_train.shape[0])
            
            val_activations, _ = model.forward(X_val, training=False)
            y_pred_val = val_activations[-1]
            y_pred_val_clipped = np.clip(y_pred_val, eps_clip, 1.0 - eps_clip)
            avg_val_loss = float(-np.mean(np.log(y_pred_val_clipped[np.arange(X_val.shape[0]), y_val])))
            val_acc = float(np.sum(np.argmax(y_pred_val, axis=1) == y_val) / X_val.shape[0])
            
            epoch_history.append({
                "epoch": ep,
                "loss": round(avg_train_loss, 4),
                "val_loss": round(avg_val_loss, 4),
                "acc": round(train_acc * 100.0, 2),
                "val_acc": round(val_acc * 100.0, 2)
            })

        avg_train_loss_final = avg_train_loss
        avg_val_loss_final = avg_val_loss
        train_acc_final = train_acc
        val_acc_final = val_acc
        
        val_preds_final = np.argmax(val_activations[-1], axis=1)
        confusion = np.zeros((7, 7), dtype=int)
        for true_label, pred_label in zip(y_val, val_preds_final):
            confusion[true_label, pred_label] += 1
            
        for w in model.weights:
            weights_dump.append(w.tolist())
        for b in model.biases:
            biases_dump.append(b.tolist())
            
    training_time = time.time() - start_time
    
    # Save the weights to a serialized model file so they can be loaded by the RAG inference code
    model_export_path = "/tmp/trained_xrd_mlp_weights.json"
    try:
        with open(model_export_path, "w") as fp:
            json.dump({
                "weights": weights_dump,
                "biases": biases_dump,
                "activation_name": activation,
                "architecture": architecture,
                "classes": CLASS_NAMES,
                "accuracy": round(val_acc_final * 100.2, 2)
            }, fp)
    except Exception as save_err:
        print(f"Warning: could not write weights to {model_export_path}: {save_err}", file=sys.stderr)

    return {
        "success": True,
        "epoch_history": epoch_history,
        "confusion_matrix": confusion.tolist(),
        "classes": CLASS_NAMES,
        "metrics": {
            "training_samples": X_train.shape[0],
            "validation_samples": X_val.shape[0],
            "total_epochs": epochs,
            "final_train_loss": round(avg_train_loss_final, 5),
            "final_val_loss": round(avg_val_loss_final, 5),
            "final_train_acc": round(train_acc_final * 100.0, 2),
            "final_val_acc": round(val_acc_final * 100.0, 2),
            "training_time_sec": round(training_time, 3),
            "accelerator": "PyTorch (CPU)" if pytorch_trained_successfully else "NumPy Model Solver"
        }
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--lr", type=float, default=0.005)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--optimizer", type=str, default="Adam")
    parser.add_argument("--architecture", type=str, default="Deep MLP")
    parser.add_argument("--noise_level", type=float, default=0.1)
    parser.add_argument("--background_drift", type=float, default=5.0)
    parser.add_argument("--strain_range", type=float, default=0.02)
    parser.add_argument("--broadening_range", type=float, default=0.25)
    parser.add_argument("--dropout", type=float, default=0.0)
    parser.add_argument("--activation", type=str, default="GELU")
    args = parser.parse_args()
    
    res_dict = train_model(
        epochs=args.epochs,
        lr=args.lr,
        batch_size=args.batch_size,
        optimizer=args.optimizer,
        architecture=args.architecture,
        noise_level=args.noise_level,
        background_drift=args.background_drift,
        strain_range=args.strain_range,
        broadening_range=args.broadening_range,
        dropout=args.dropout,
        activation=args.activation
    )
    
    print(json.dumps(res_dict))
