import sys
import json
import io
import base64
import traceback

def main():
    try:
        # Read from standard input
        stdin_data = sys.stdin.read()
        payload = json.loads(stdin_data)
        
        code = payload.get("code", "")
        if not code.strip():
            print(json.dumps({"success": False, "error": "No Python code provided."}))
            return
        
        # Core injection for headless plotting and figure capturing
        header = """
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import io
import base64
"""
        
        # Execute the user code in a dynamic dict context
        exec_globals = {
            "__builtins__": __builtins__,
        }
        
        # Combine the header and user-supplied code
        full_code = f"{header}\n{code}"
        
        # Run execution
        # We redirect stdout so print statements in user code don't mess up our JSON stdout return
        captured_stdout = io.StringIO()
        sys.stdout = captured_stdout
        
        try:
            exec(full_code, exec_globals)
            # Restore stdout
            sys.stdout = sys.__stdout__
            stdout_str = captured_stdout.getvalue()
            
            # Retrieve the active figure from the context
            plt = exec_globals.get('plt')
            image_base64 = None
            
            if plt:
                try:
                    fig = plt.gcf()
                    if fig and fig.get_axes():
                        buf = io.BytesIO()
                        # Use a dark slate color or transparent background if the user specified transparent
                        plt.savefig(buf, format='png', dpi=180, bbox_inches='tight', transparent=True)
                        buf.seek(0)
                        img_data = buf.read()
                        image_base64 = "data:image/png;base64," + base64.b64encode(img_data).decode('utf-8')
                        plt.close(fig)
                except Exception as inner_e:
                    # Log fallback
                    pass
            
            if not image_base64:
                # Let's check standard matplotlib.pyplot in case they imported under a different name or to be failsafe
                import matplotlib.pyplot as fallback_plt
                fig = fallback_plt.gcf()
                if fig and fig.get_axes():
                    buf = io.BytesIO()
                    fallback_plt.savefig(buf, format='png', dpi=180, bbox_inches='tight', transparent=True)
                    buf.seek(0)
                    img_data = buf.read()
                    image_base64 = "data:image/png;base64," + base64.b64encode(img_data).decode('utf-8')
                    fallback_plt.close(fig)
                    
            print(json.dumps({
                "success": True, 
                "image": image_base64,
                "stdout": stdout_str
            }))
            
        except Exception as run_error:
            # Restore stdout on compile/exec errors
            sys.stdout = sys.__stdout__
            error_msg = traceback.format_exc()
            print(json.dumps({
                "success": False,
                "error": str(run_error),
                "traceback": error_msg,
                "stdout": captured_stdout.getvalue()
            }))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Internal generator fault: {str(e)}"}))

if __name__ == "__main__":
    main()
