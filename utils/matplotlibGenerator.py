import sys
import json
import io
import base64
import time
import traceback

def get_clean_traceback(e, header_line_count=0):
    """Formats traceback stripping internal runner lines and adjusting line numbers."""
    tb_lines = traceback.format_exception(type(e), e, e.__traceback__)
    cleaned = []
    for line in tb_lines:
        # Hide generator runner internal calls
        if "matplotlibGenerator.py" in line and "exec(" not in line:
            continue
        cleaned.append(line)
    return "".join(cleaned)

def main():
    start_time = time.time()
    try:
        # Read payload from stdin
        stdin_data = sys.stdin.read()
        if not stdin_data.strip():
            print(json.dumps({"success": False, "error": "Empty input payload."}))
            return

        payload = json.loads(stdin_data)
        code = payload.get("code", "")
        dpi = int(payload.get("dpi", 200))
        theme = payload.get("theme", "custom") # "dark", "publication_nature", "academic_light", "transparent", "custom"
        transparent = payload.get("transparent", False)
        output_format = payload.get("format", "both") # "png", "svg", "pdf", "both"

        if not code.strip():
            print(json.dumps({"success": False, "error": "No Python code provided."}))
            return

        # Prepare execution environment & pre-imported libraries
        header_lines = [
            "import matplotlib",
            "matplotlib.use('Agg')",
            "import matplotlib.pyplot as plt",
            "import matplotlib.cm as cm",
            "import matplotlib.patches as patches",
            "from mpl_toolkits.mplot3d import Axes3D",
            "import numpy as np",
            "import scipy",
            "import scipy.signal as signal",
            "import scipy.optimize as optimize",
            "import scipy.interpolate as interpolate",
            "import math",
            "import io",
            "import base64",
            "import json"
        ]

        # Apply rcParams themes if requested
        if theme == "dark":
            header_lines.extend([
                "plt.rcParams.update({",
                "    'figure.facecolor': '#0b1120',",
                "    'axes.facecolor': '#0f172a',",
                "    'axes.edgecolor': '#334155',",
                "    'axes.labelcolor': '#94a3b8',",
                "    'text.color': '#f8fafc',",
                "    'xtick.color': '#94a3b8',",
                "    'ytick.color': '#94a3b8',",
                "    'grid.color': '#1e293b',",
                "    'grid.linestyle': '--',",
                "    'grid.alpha': 0.6,",
                "    'font.size': 9.5,",
                "    'figure.titlesize': 12,",
                "    'axes.titlesize': 11,",
                "    'legend.facecolor': '#1e293b',",
                "    'legend.edgecolor': '#334155',",
                "    'legend.labelcolor': '#f1f5f9'",
                "})"
            ])
        elif theme == "publication_nature":
            header_lines.extend([
                "plt.rcParams.update({",
                "    'figure.facecolor': '#ffffff',",
                "    'axes.facecolor': '#ffffff',",
                "    'axes.edgecolor': '#000000',",
                "    'axes.linewidth': 1.2,",
                "    'axes.labelcolor': '#000000',",
                "    'text.color': '#000000',",
                "    'xtick.color': '#000000',",
                "    'ytick.color': '#000000',",
                "    'xtick.direction': 'in',",
                "    'ytick.direction': 'in',",
                "    'xtick.major.size': 4,",
                "    'ytick.major.size': 4,",
                "    'font.family': 'sans-serif',",
                "    'font.size': 10,",
                "    'legend.frameon': True,",
                "    'legend.edgecolor': '#cccccc',",
                "    'legend.facecolor': '#ffffff'",
                "})"
            ])
        elif theme == "academic_light":
            header_lines.extend([
                "plt.rcParams.update({",
                "    'figure.facecolor': '#f8fafc',",
                "    'axes.facecolor': '#ffffff',",
                "    'axes.edgecolor': '#cbd5e1',",
                "    'axes.labelcolor': '#334155',",
                "    'text.color': '#0f172a',",
                "    'xtick.color': '#475569',",
                "    'ytick.color': '#475569',",
                "    'grid.color': '#e2e8f0',",
                "    'grid.linestyle': ':',",
                "    'font.size': 9.5",
                "})"
            ])

        header = "\n".join(header_lines) + "\n"
        full_code = f"{header}{code}"

        exec_globals = {
            "__builtins__": __builtins__,
            "__name__": "__main__"
        }

        captured_stdout = io.StringIO()
        sys.stdout = captured_stdout

        try:
            exec(full_code, exec_globals)
            sys.stdout = sys.__stdout__
            stdout_str = captured_stdout.getvalue()

            import matplotlib.pyplot as active_plt

            # Find all open figures
            fig_nums = active_plt.get_fignums()
            figures_list = []

            primary_image_base64 = None
            primary_svg_data = None
            primary_pdf_base64 = None

            for fnum in fig_nums:
                fig = active_plt.figure(fnum)
                # Check if figure contains any drawn axes/content
                if fig and (len(fig.get_axes()) > 0 or len(fig.lines) > 0 or len(fig.patches) > 0 or len(fig.texts) > 0):
                    fig_info = {
                        "figureId": int(fnum),
                        "widthInches": float(fig.get_figwidth()),
                        "heightInches": float(fig.get_figheight()),
                        "dpi": dpi
                    }

                    # Render PNG
                    png_buf = io.BytesIO()
                    fig.savefig(png_buf, format='png', dpi=dpi, bbox_inches='tight', transparent=transparent)
                    png_buf.seek(0)
                    png_bytes = png_buf.read()
                    fig_info["png"] = "data:image/png;base64," + base64.b64encode(png_bytes).decode('utf-8')

                    # Render SVG (Scalable Vector Graphics for publication)
                    svg_buf = io.StringIO()
                    fig.savefig(svg_buf, format='svg', bbox_inches='tight', transparent=transparent)
                    svg_buf.seek(0)
                    svg_content = svg_buf.getvalue()
                    fig_info["svg"] = svg_content
                    fig_info["svgDataUrl"] = "data:image/svg+xml;utf8," + svg_content.replace("#", "%23")

                    # Render PDF
                    try:
                        pdf_buf = io.BytesIO()
                        fig.savefig(pdf_buf, format='pdf', bbox_inches='tight', transparent=transparent)
                        pdf_buf.seek(0)
                        fig_info["pdf"] = "data:application/pdf;base64," + base64.b64encode(pdf_buf.read()).decode('utf-8')
                    except Exception:
                        fig_info["pdf"] = None

                    figures_list.append(fig_info)

                    if primary_image_base64 is None:
                        primary_image_base64 = fig_info["png"]
                        primary_svg_data = fig_info["svg"]
                        primary_pdf_base64 = fig_info["pdf"]

            # Close all figures to free memory
            active_plt.close('all')

            exec_time_ms = round((time.time() - start_time) * 1000, 2)

            # Check if user script exported custom metadata or structured data
            custom_metadata = None
            for key in ["output_data", "results", "analysis_summary", "peak_table", "metrics"]:
                if key in exec_globals and isinstance(exec_globals[key], (dict, list, str, int, float, bool)):
                    if custom_metadata is None:
                        custom_metadata = {}
                    custom_metadata[key] = exec_globals[key]

            print(json.dumps({
                "success": True,
                "image": primary_image_base64,
                "svg": primary_svg_data,
                "pdf": primary_pdf_base64,
                "figures": figures_list,
                "figureCount": len(figures_list),
                "stdout": stdout_str,
                "metadata": custom_metadata,
                "executionTimeMs": exec_time_ms,
                "dpi": dpi,
                "theme": theme
            }))

        except Exception as run_error:
            sys.stdout = sys.__stdout__
            exec_time_ms = round((time.time() - start_time) * 1000, 2)
            tb = get_clean_traceback(run_error, len(header_lines))
            print(json.dumps({
                "success": False,
                "error": str(run_error),
                "traceback": tb,
                "stdout": captured_stdout.getvalue(),
                "executionTimeMs": exec_time_ms
            }))

    except Exception as e:
        sys.stdout = sys.__stdout__
        print(json.dumps({
            "success": False,
            "error": f"Matplotlib Kernel execution fault: {str(e)}",
            "traceback": traceback.format_exc()
        }))

if __name__ == "__main__":
    main()
