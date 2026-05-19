#!/usr/bin/env python3
# generate_icons.py - Run this to create app icons
import base64

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#0a0608"/>
  <text x="96" y="130" text-anchor="middle" font-size="110">🧛</text>
</svg>'''

with open('public/icon.svg', 'w') as f:
    f.write(svg_content)

print("icon.svg created. Use a tool like sharp or squoosh to convert to PNG.")
print("Or use: https://squoosh.app to convert SVG to PNG at 192x192 and 512x512")
