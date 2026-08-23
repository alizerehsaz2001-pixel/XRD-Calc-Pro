import re

with open('components/SupercellTransformationModule.tsx', 'r') as f:
    lines = f.readlines()

# The file currently has:
# ...
# 1258: {activeTab === 'results' && (
# ... results content ...
# 1514: )}
# 1516: {activeTab === 'mapping' && (
# ... mapping content ...
# 1677: </div>)} 
# 1681: Python panel

# I want the order to be:
# ...
# {activeTab === 'mapping' && (
# ... mapping content ...
# </motion.div>)}
# </AnimatePresence>
# </>)}
#
# {appState === 'computing' && ( ... )}
#
# {appState === 'results' && (
# ... results content ...
# ... Python panel ...
# </div>)}
# </div>)

# Let's just find the blocks using regex or line indices.
for i, l in enumerate(lines):
    if "{activeTab === 'results' && (" in l:
        results_start = i
    elif "{activeTab === 'mapping' && (" in l:
        mapping_start = i
    elif "{showPythonPanel && (" in l:
        python_start = i

results_end = mapping_start - 2
mapping_end = python_start - 2

results_content = lines[results_start:results_end+1]
mapping_content = lines[mapping_start:mapping_end+1]
python_content = lines[python_start:]

# Inside results_content, there is a "<motion.div ...>". Let's remove the motion.div wrapper to make it standard.
# Or just keep it as <div className="space-y-6 ...">

# Let's look at what we actually want to output.
