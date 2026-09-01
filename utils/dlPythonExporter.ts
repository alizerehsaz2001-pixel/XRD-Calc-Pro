// Python Deep Learning Architecture & Export Templates for XRD Analysis

import { getActiveMaterials } from './materialsHelper';

const MATERIAL_DB = getActiveMaterials();

export const getPythonEngineCode = (arch: 'cnn' | 'transformer' | 'graph_gnn' | 'rag_pipeline', config: any): string => {
    const mapActivation = (act: string) => {
      const lower = (act || "relu").toLowerCase();
      if (lower === "relu") return "relu";
      if (lower === "leakyrelu") return "leaky_relu";
      if (lower === "gelu") return "gelu";
      if (lower === "sigmoid") return "sigmoid";
      if (lower === "swish" || lower === "silu") return "silu";
      if (lower === "elu") return "elu";
      return "relu";
    };

    if (arch === 'transformer') {
      return `import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import numpy as np

# XRD-Calc Pro - 1D Vision-Transformer (ViT) Spectral Encoder
# High-fidelity self-attention modeling for long-range XRD peak correlation.
# T-Theta segments are parsed as tokens, enriched with position embeddings,
# and analyzed via Multihead-Attention layer blocks.

class PatchEmbedding1D(nn.Module):
    """Splits continuous XRD spectra into non-overlapping patches and projects to embedding space"""
    def __init__(self, seq_len=1000, patch_size=20, in_chans=1, embed_dim=128):
        super().__init__()
        self.num_patches = seq_len // patch_size
        self.patch_size = patch_size
        self.proj = nn.Conv1d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        # Input shape: (B, 1, SeqLen) -> Output: (B, EmbedDim, NumPatches)
        x = self.proj(x)
        # Permute to (B, NumPatches, EmbedDim) for Transformer Encoder
        return x.transpose(1, 2)

class TransformerSpectrumEncoder(nn.Module):
    """Self-Attention Transformer for Crystallographic Fingerprinting"""
    def __init__(self, seq_len=1000, patch_size=20, num_classes=${MATERIAL_DB.length}, 
                 embed_dim=128, depth=4, num_heads=8, mlp_ratio=4.0, dropout=${config.dropout || 0.1}):
        super().__init__()
        self.patch_embed = PatchEmbedding1D(seq_len, patch_size, 1, embed_dim)
        num_patches = self.patch_embed.num_patches
        
        # Class token and Positional Embeddings
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.pos_drop = nn.Dropout(p=dropout)
        
        # Transformer Blocks
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim, 
            nhead=num_heads, 
            dim_feedforward=int(embed_dim * mlp_ratio), 
            dropout=dropout,
            activation='gelu',
            batch_first=True
        )
        self.blocks = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        self.norm = nn.LayerNorm(embed_dim)
        
        # Classifier Head
        self.head = nn.Linear(embed_dim, num_classes)
        
        # Initialize weights
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        self.apply(self._init_weights)

    def _init_weights(self, m):
        if isinstance(m, nn.Linear):
            nn.init.trunc_normal_(m.weight, std=0.01)
            if m.bias is not None:
                nn.init.constant_(m.bias, 0)
        elif isinstance(m, nn.LayerNorm):
            nn.init.constant_(m.bias, 0)
            nn.init.constant_(m.weight, 1.0)

    def forward(self, x):
        B = x.shape[0]
        # (B, NumPatches, EmbedDim)
        x = self.patch_embed(x)
        
        # Prepend Classifier (CLS) token
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        
        # Inject structural positional embeddings
        x = self.pos_drop(x + self.pos_embed)
        
        # Execute self-attention sequence encoding
        x = self.blocks(x)
        x = self.norm(x)
        
        # Classify based on the output at the Class token position
        class_vector = x[:, 0]
        return self.head(class_vector)

if __name__ == '__main__':
    model = TransformerSpectrumEncoder()
    # Batch size: 8 sweeps of 1000 2-theta grid items
    xrd_profiles = torch.rand((8, 1, 1000))
    logits = model(xrd_profiles)
    print("Spectral Vision-Transformer Initialized successfully.")
    print("Shape output logit matrix:", logits.shape)
`;
    }

    if (arch === 'graph_gnn') {
      return `import torch
import torch.nn as nn
import torch.nn.functional as F
try:
    import torch_geometric
    from torch_geometric.nn import GCNConv, global_mean_pool
    from torch_geometric.data import Data, Batch
except ImportError:
    # Educational wrapper mock to ensure error-free running if package isn't preinstalled
    print("PyTorch Geometric not found. Installing 'torch-geometric' via pip is recommended for crystalline graph modeling.")
    # Fallback placeholders for educational execution
    GCNConv = None
    global_mean_pool = None

# XRD-Calc Pro - Crystalline Graph Neural Network (GNN) Engine
# CGCNN Architecture representation. Instead of analyzing raw 1D sweeps,
# the mineral is represented as an atomic coordinate graph:
# Coordinates/atomic numbers form node features, bond distances form edges.

class CrystallineGraphGNN(nn.Module):
    """3D Crystal Structure classification engine using Graph Neural Networks"""
    def __init__(self, node_feature_dim=16, hidden_dim=${config.filters || 64}, num_classes=${MATERIAL_DB.length}):
        super().__init__()
        self.has_pyg = GCNConv is not None
        
        if self.has_pyg:
            # Dual message passing layers to aggregate atomic environment spheres
            self.conv1 = GCNConv(node_feature_dim, hidden_dim)
            self.conv2 = GCNConv(hidden_dim, hidden_dim)
            self.fc1 = nn.Linear(hidden_dim, hidden_dim)
            self.fc2 = nn.Linear(hidden_dim, num_classes)
        else:
            self.linear = nn.Linear(node_feature_dim, num_classes)

    def forward(self, x, edge_index, batch_index):
        if self.has_pyg:
            # 1. Message passing to resolve atomic neighborhood coordinates
            h = self.conv1(x, edge_index)
            h = F.relu(h)
            h = self.conv2(h, edge_index)
            h = F.relu(h)
            
            # 2. Graph Pooling to retain translation/rotation invariance in unit cell
            pooled = global_mean_pool(h, batch_index)
            
            # 3. Dense classifications
            out = F.relu(self.fc1(pooled))
            return self.fc2(out)
        else:
            # Simplified mock pooling
            mean_pooled = torch.mean(x, dim=0, keepdim=True)
            return self.linear(mean_pooled)

def generate_mock_crystal_graph():
    """Generates a synthetic FCC Diamond Silicon unit cell graph representation"""
    # 8 Silicon atoms in unit cell (atomic number 14)
    # Feature vector: [atomic_number, valence_electrons, covalent_radius, electronegativity]
    silicon_node_feats = torch.tensor([
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9]
    ], dtype=torch.float)
    
    # Adjacency matrices of direct covalent bonds
    edge_index = torch.tensor([
        [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
        [1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6]
    ], dtype=torch.long)
    
    batch_vector = torch.zeros(8, dtype=torch.long) # All nodes belong to graph 0
    return silicon_node_feats, edge_index, batch_vector

if __name__ == '__main__':
    model = CrystallineGraphGNN()
    feats, edges, batch = generate_mock_crystal_graph()
    
    # Simulating forward pass
    outputs = model(feats, edges, batch)
    print("Graph Crystalline Neural Engine successfully compiled.")
    print("Output shape on unit cell classification:", outputs.shape)
`;
    }

    if (arch === 'rag_pipeline') {
      return `import os
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
except ImportError:
    chromadb = None
    SentenceTransformer = None

# XRD-Calc Pro - Enterprise Crystalline Retrieval-Augmented Generation (RAG) Pipeline
# Demonstrates a fully-fledged materials database query mechanism.
# Raw experimental peaks are embedded into space vectors, candidate PDF cards are
# retrieved from ChromaDB, and context-injected into the Gemini API framework.

# Comprehensive local powder diffraction standards database
MATERIALS_PDF_DB = [
    {
        "name": "Beta-Quartz (SiO2, Hexagonal, P6222)",
        "peaks": "20.6, 25.8, 36.4, 38.8, 42.3",
        "description": "High temperature polymorph of Quartz, major stable ceramic skeleton."
    },
    {
        "name": "Rutile (TiO2, Tetragonal, P42/mnm)",
        "peaks": "27.4, 36.1, 41.2, 54.3, 56.6",
        "description": "Birefringent titanium oxide mineral, pristine photo-catalyst benchmark."
    },
    {
        "name": "Anatase (TiO2, Tetragonal, I41/amd)",
        "peaks": "25.3, 37.8, 48.0, 53.9, 55.1",
        "description": "Metastable polymorph of TiO2 with heightened electron transport properties."
    },
    {
        "name": "Corundum (Al2O3, Trigonal, R-3c)",
        "peaks": "25.6, 35.1, 37.8, 43.3, 52.5, 57.5",
        "description": "Aluminium oxide crystalline standard, extremely high structural hardness."
    },
    {
        "name": "Halite (NaCl, Cubic, Fm-3m)",
        "peaks": "27.3, 31.7, 45.4, 53.8, 56.4",
        "description": "Rock salt octahedral crystal standard used in general peak calibrations."
    }
]

class MaterialRAGManager:
    def __init__(self):
        print("Initializing SentenceTransformer Embedding Encoder (all-MiniLM-L6-v2)...")
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2") if SentenceTransformer else None
        
        if chromadb:
            # Setup Chroma Vector DB on local ephemeral memory structure
            self.chroma_client = chromadb.EphemeralClient()
            self.collection = self.chroma_client.create_collection(name="diffraction_standards")
            self._seed_database()
        else:
            self.collection = None
            print("ChromaDB not installed. Standard list similarity lookups will act as safe fallback.")

    def _seed_database(self):
        """Generates dense vector embeddings for physical material descriptors"""
        for idx, item in enumerate(MATERIALS_PDF_DB):
            document_content = f"Material: {item['name']}. Peaks: {item['peaks']}. Description: {item['description']}"
            embedding = self.embedding_model.encode(document_content).tolist()
            
            self.collection.add(
                embeddings=[embedding],
                documents=[document_content],
                metadatas=[{"name": item["name"], "peaks": item["peaks"]}],
                ids=[f"mat_{idx}"]
            )
        print("ChromaDB successfully seeded with PDF phase standards.")

    def query_material(self, user_peaks: str, top_k=2):
        """Retrieves best-fit candidate cards using vector distance clustering"""
        if self.collection and self.embedding_model:
            query_vector = self.embedding_model.encode(f"XRD peaks: {user_peaks}").tolist()
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=top_k
            )
            return results["documents"][0]
        else:
            # Simple keyword overlap fallback
            print("Running fallback rule-based substring matching...")
            matches = []
            for item in MATERIALS_PDF_DB:
                score = len(set(user_peaks.split()).intersection(set(item["peaks"].split())))
                matches.append((item, score))
            matches.sort(key=lambda x: x[1], reverse=True)
            return [f"Material: {m[0]['name']}. Peaks: {m[0]['peaks']}. Description: {m[0]['description']}" for m in matches[:top_k]]

def gemini_retrieval_augmented_generation(user_xrd_query: str):
    """Connects Grounded Vector Retrieval directly into Google Gemini API Pro"""
    # 1. Retrieve most relevant physical phase matches from Chromatography DB
    rag_manager = MaterialRAGManager()
    database_grounding_contexts = rag_manager.query_material(user_xrd_query, top_k=2)
    
    print("\\n[RAG Phase] Retrieved Grounding Context from Vector DB:")
    for doc in database_grounding_contexts:
        print(">> ", doc)
        
    combined_grounding_text = "\\n".join(database_grounding_contexts)
    
    # 2. Invoke Gemini Pro with our context-loaded instruction suite
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\\n[ERROR] GEMINI_API_KEY environment variable missing. Please export your secret key.")
        return
        
    if not genai:
        print("\\nNote: 'google-genai' SDK is recommended. Printing compiled prompting payload:")
        print("System Instruction: You are an expert Crystallographer executing RAG validations.")
        print(f"Grounding Context:\\n{combined_grounding_text}")
        print(f"User Query:\\n{user_xrd_query}")
        return

    client = genai.Client(api_key=api_key)
    prompt = f\"\"\"
    You are an AI Crystallography Assistant. Analyze the user's experimental diffraction peaks.
    
    Use the following verified Database Grounding Context to match peaks and identify phases:
    {combined_grounding_text}
    
    User Experimental Peaks:
    {user_xrd_query}
    
    Determine the most likely chemical phase match and explain your logical reasoning.
    \"\"\"
    
    print("\\nCalling Google Gemini API model 'gemini-3.1-pro-preview'...")
    response = client.models.generate_content(
        model='gemini-3.1-pro-preview',
        contents=prompt
    )
    print("\\n=== AI Analysis Output (Grounded RAG) ===")
    print(response.text)

if __name__ == '__main__':
    # Simulating a user query for Rutile Titanium Oxide
    experimental_peaks = "27.4, 36.1, 41.2"
    gemini_retrieval_augmented_generation(experimental_peaks)
`;
    }

    // Default 'cnn' (Residual 1D CNN)
    return `import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import torch.optim.lr_scheduler as lr_scheduler
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# XRD-Calc Pro - Scientific PyTorch Phase ID Engine Script
# Configuration used in simulation:
# Context Depth: ${config.depth || 50} Layers | Dropout: ${(config as any).dropout || 0} | Scaling: ${config.multiScale ? 'True' : 'False'}
# Kernel Size: ${config.kernelSize}
# Multi-Scale: ${config.multiScale}
# Batch Norm: ${config.batchNorm}
# Dropout: ${(config as any).dropout}
# Attention: ${(config as any).attentionMechanism}

class XRDDataAugmentation(nn.Module):
    """Stochastic Data Augmentation for XRD Profiles"""
    def __init__(self, noise_std=0.02, mask_prob=0.05):
        super().__init__()
        self.noise_std = noise_std
        self.mask_prob = mask_prob

    def forward(self, x):
        if self.training:
            # Add structural noise equivalent to detector counting variations
            noise = torch.randn_like(x) * self.noise_std
            # Random artifact masking to force robust peak learning
            mask = (torch.rand_like(x) > self.mask_prob).float()
            return (x + noise) * mask
        return x

class ResidualBlock1D(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, dropout=${(config as any).dropout || 0}):
        super().__init__()
        self.conv1 = nn.Conv1d(in_channels, out_channels, kernel_size, padding='same')
        self.bn1 = nn.BatchNorm1d(out_channels) if ${config.batchNorm ? 'True' : 'False'} else nn.Identity()
        self.conv2 = nn.Conv1d(out_channels, out_channels, kernel_size, padding='same')
        self.bn2 = nn.BatchNorm1d(out_channels) if ${config.batchNorm ? 'True' : 'False'} else nn.Identity()
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        res = x
        x = F.${mapActivation(config.activation)}(self.bn1(self.conv1(x)))
        x = self.dropout(x)
        x = self.bn2(self.conv2(x))
        return F.${mapActivation(config.activation)}(x + res)

class XRDPhaseIDModel(nn.Module):
    def __init__(self, num_classes=${MATERIAL_DB.length}, kernel_size=${config.kernelSize}):
        super().__init__()
        self.augment = XRDDataAugmentation()
        self.attn = nn.MultiheadAttention(1, 1) if ${(config as any).attentionMechanism ? 'True' : 'False'} else None
        self.initial_conv = nn.Conv1d(1, ${config.filters || 32}, kernel_size, padding='same')
        
        # Deep Residual Feature Extraction (${config.depth} layers simulated)
        self.blocks = nn.ModuleList([
            ResidualBlock1D(${config.filters || 32}, ${config.filters || 32}, kernel_size)
            for _ in range(${Math.floor((config.depth || 50) / 10)})
        ])
        
        self.pool = nn.${config.pooling === 'max' ? 'MaxPool1d' : 'AvgPool1d'}(2)
        self.fc = nn.Linear((${config.filters || 32} * 100), num_classes) # Approximate representation
        
    def forward(self, x):
        x = self.augment(x)
        if self.attn:
            x_permuted = x.permute(2, 0, 1)
            attn_out, _ = self.attn(x_permuted, x_permuted, x_permuted)
            x = attn_out.permute(1, 2, 0)
            
        x = F.${mapActivation(config.activation)}(self.initial_conv(x))
        for block in self.blocks:
            x = block(x)
            x = self.pool(x)
            
        x = x.view(x.size(0), -1)
        return self.fc(x)

def train_engine():
    model = XRDPhaseIDModel()
    optimizer = optim.${config.optimization || 'Adam'}(model.parameters(), lr=${config.learningRate || 0.001})
    loss_fn = nn.CrossEntropyLoss()
    
    print("PyTorch Phase ID Model Initialized.")
    print("Optimization Algorithm:", optimizer.__class__.__name__)
    print("Learning Rate:", optimizer.param_groups[0]['lr'])
    return model

if __name__ == '__main__':
    model = train_engine()
    mock_xrd_sweep = torch.rand((16, 1, 1000)) 
    predictions = model(mock_xrd_sweep)
    print("Inference completed. Logic structure valid.")
    print("Predictions shape:", predictions.shape)
`;
  };
