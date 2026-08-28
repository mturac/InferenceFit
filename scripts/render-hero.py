from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math
import random

W, H = 1536, 860
ACCENT = (197, 65, 228)
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'

def font(path, size):
    return ImageFont.truetype(path, size)

def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

image = Image.new('RGB', (W, H))
pixels = image.load()
for y in range(H):
    for x in range(W):
        t = (x / W) * 0.65 + (y / H) * 0.35
        glow = max(0, 1 - math.hypot(x - W * 0.73, y - H * 0.4) / (W * 0.55))
        pixels[x, y] = (
            int(8 * (1 - t) + 31 * t + ACCENT[0] * glow * 0.12),
            int(10 * (1 - t) + 15 * t + ACCENT[1] * glow * 0.12),
            int(27 * (1 - t) + 48 * t + ACCENT[2] * glow * 0.12)
        )

image = image.convert('RGBA')
draw = ImageDraw.Draw(image, 'RGBA')
for x in range(0, W, 64):
    draw.line((x, 0, x, H), fill=(255, 255, 255, 9))
for y in range(0, H, 64):
    draw.line((0, y, W, y), fill=(255, 255, 255, 9))
random.seed(9)
for _ in range(190):
    x = random.randrange(W)
    y = random.randrange(H)
    draw.ellipse((x, y, x + 2, y + 2), fill=(255, 255, 255, random.randrange(8, 26)))

rounded(draw, (70, 70, 210, 210), 32, (*ACCENT, 38), (*ACCENT, 220), 3)
for index, height in enumerate([32, 58, 82, 52]):
    draw.rounded_rectangle((100 + index * 20, 178 - height, 113 + index * 20, 178), radius=5, fill=(*ACCENT, 230))
draw.text((250, 70), 'InferenceFit', font=font(BOLD, 72), fill='white')
draw.text((252, 157), 'Select coding models by verified repository outcomes—not leaderboard vibes.', font=font(REGULAR, 29), fill=(208, 213, 234, 255))

steps = [
    ('Collect', 'Task outcome receipts'),
    ('Normalize', 'Cost · time · patch'),
    ('Gate', 'Hard quality floors'),
    ('Rank', 'Eligible models only'),
    ('Recommend', 'Evidence + exact reason')
]
for index, (label, detail) in enumerate(steps):
    x = 78 + index * 285
    rounded(draw, (x, 290, x + 250, 435), 24, (12, 17, 39, 218), (*ACCENT, 115), 2)
    draw.ellipse((x + 18, 308, x + 58, 348), fill=(*ACCENT, 225))
    draw.text((x + 31, 312), str(index + 1), font=font(BOLD, 20), fill='white')
    draw.text((x + 72, 308), label, font=font(BOLD, 22), fill='white')
    draw.text((x + 20, 366), detail, font=font(REGULAR, 16), fill=(178, 185, 211, 255))

rounded(draw, (78, 500, 1020, 775), 28, (5, 8, 20, 238), (255, 255, 255, 28), 2)
draw.text((108, 525), '$ inferencefit evaluate repo-suite.json --min-success 0.80', font=font(MONO, 20), fill=(127, 245, 184, 255))
rows = [('model-a', '92%', '$0.225', 'ELIGIBLE'), ('model-b', '61%', '$0.115', 'REJECT'), ('model-c', '84%', '$0.310', 'ELIGIBLE')]
for index, row in enumerate(rows):
    y = 590 + index * 48
    draw.text((110, y), row[0], font=font(MONO, 20), fill='white')
    draw.text((360, y), row[1], font=font(MONO, 20), fill=(213, 218, 235, 255))
    draw.text((500, y), row[2], font=font(MONO, 20), fill=(213, 218, 235, 255))
    draw.text((700, y), row[3], font=font(BOLD, 20), fill=(108, 233, 168, 255) if row[3] == 'ELIGIBLE' else (255, 113, 125, 255))
draw.text((110, 730), 'RECOMMENDATION  model-a · best utility after every quality floor', font=font(MONO, 18), fill=(*ACCENT, 255))

rounded(draw, (1055, 500, 1458, 775), 28, (13, 17, 39, 220), (*ACCENT, 125), 2)
draw.text((1085, 526), 'EVIDENCE CONTRACT', font=font(BOLD, 20), fill=(*ACCENT, 255))
for index, (key, value) in enumerate([('Generic benchmark', 'no'), ('Verified outcome', 'yes'), ('Network calls', '0'), ('Report hash', 'SHA-256')]):
    y = 580 + index * 48
    draw.text((1085, y), key, font=font(REGULAR, 17), fill=(164, 174, 204, 255))
    value_width = draw.textlength(value, font=font(BOLD, 20))
    draw.text((1428 - value_width, y - 2), value, font=font(BOLD, 20), fill='white')

draw.text((78, 815), 'VIBE CODING TOOL SUITE  •  OPEN SOURCE  •  APACHE-2.0', font=font(BOLD, 16), fill=(151, 159, 188, 230))
out = Path('docs/assets/inferencefit-hero.png')
out.parent.mkdir(parents=True, exist_ok=True)
image.convert('RGB').save(out, 'PNG', optimize=True)
