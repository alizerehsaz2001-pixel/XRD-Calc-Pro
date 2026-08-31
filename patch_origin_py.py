with open("utils/originFwhmPlotter.py", "r") as f:
    content = f.read()

origin_script_template = """
    originpro_code = f\"\"\"# ==============================================================================
# OriginPro Native Script (using originpro python API)
# Generates the Worksheet and Native Plot inside OriginLab
# Instructions: Open Origin 2021+ -> Alt+5 to open Python Console -> Paste this code.
# ==============================================================================
import numpy as np
import originpro as op
import sys

def pseudo_voigt(x, x0, fwhm, eta, height):
    eta = np.clip(eta, 0.0, 1.0)
    sigma = fwhm / (2.0 * np.sqrt(2.0 * np.log(2.0)))
    gamma = fwhm / 2.0
    G = np.exp(-0.5 * ((x - x0) / sigma) ** 2)
    L = 1.0 / (1.0 + ((x - x0) / gamma) ** 2)
    return height * ((1.0 - eta) * G + eta * L)

# Parameters
center = {center:.4f}
fwhm = {fwhm:.4f}
eta = {eta:.3f}
height = {height:.1f}
bg_const = {bg_const:.1f}
bg_slope = {bg_slope:.3f}

# Check if Origin is accessible
if op and op.oext:
    op.set_show(True)
else:
    print("This script must be run inside OriginPro Python Console or with OriginPro Ext.")
    sys.exit(0)

# Generate Data
x = np.linspace({x_min:.3f}, {x_max:.3f}, {n_points})
bg = bg_const + bg_slope * (x - center)
y_calc = bg + pseudo_voigt(x, center, fwhm, eta, height)

# Create Worksheet
wks = op.new_sheet()
wks.name = 'XRD_Peak_Data'
wks.set_labels(['2Theta', 'Intensity_Obs', 'Intensity_Fit', 'Baseline'])
wks.from_list(0, x.tolist(), 'X')
# Simulating obs with fit for synthetic, otherwise you'd inject real Y here
wks.from_list(1, y_calc.tolist(), 'Y') 
wks.from_list(2, y_calc.tolist(), 'Y')
wks.from_list(3, bg.tolist(), 'Y')

# Create Graph
gp = op.new_graph(template='Origin')
gl = gp[0]
gl.add_plot(wks, coly=1, colx=0, type='scatter')
gl.add_plot(wks, coly=2, colx=0, type='line')
gl.add_plot(wks, coly=3, colx=0, type='line')

# Customize Graph
gl.set_xlim({x_min:.3f}, {x_max:.3f}, 0.5)
gl.xaxis.title = 'Diffraction Angle 2\\\\theta (degrees)'
gl.yaxis.title = 'Intensity I (counts)'
gl.rescale()

print("Successfully exported XRD Fit to OriginPro Worksheet & Graph.")
\"\"\"
"""

content = content.replace("jupyter_notebook = generate_jupyter_notebook_json(python_code, title=\"OriginPro_XRD_FWHM_Deconvolution\")", origin_script_template + "\n    jupyter_notebook = generate_jupyter_notebook_json(python_code, title=\"OriginPro_XRD_FWHM_Deconvolution\")")

content = content.replace("'jupyter_notebook': jupyter_notebook,", "'jupyter_notebook': jupyter_notebook,\n        'originpro_script': originpro_code,")

with open("utils/originFwhmPlotter.py", "w") as f:
    f.write(content)
