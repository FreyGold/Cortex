with open('/home/frey/Visual Studio Code/A/college/Graduation Project/frontend/components/notes/note-editor-page.tsx', 'r') as f:
    lines = f.readlines()

# Clean up any logic errors in the tail
# We just need to make sure the JSX is valid.
# I'll find where the return starts and where it ends.

start_line = -1
for i, line in enumerate(lines):
    if 'return (' in line and 'TooltipProvider' in lines[i+1]:
        start_line = i
        break

if start_line == -1:
    print("Could not find start")
    exit(1)

# I will replace from start_line to the end with a known clean structure 
# but I need to keep the content variables.
# Actually I'll just fix the tail carefully.

# Re-read the file to get the correct indices
with open('/home/frey/Visual Studio Code/A/college/Graduation Project/frontend/components/notes/note-editor-page.tsx', 'r') as f:
    text = f.read()

import re

# Find the last bit of the sidebar and replace the closing mess
# The previous semantic search block ended with a Link map.
# I'll search for the semanticSearchMutation.data map.

pattern = r'\{\(semanticSearchMutation\.data\?\.matches\s\?\?\s\[\]\)\.length\s>\s0\s&&[\s\S]+?\}\s+</div>\s+</div>\s+</div>\s+</div>\s+TooltipProvider'
# This is too brittle.

# Let's just rewrite the end of the file from a stable point.
# A stable point is line 204 'return ('
