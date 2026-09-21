from pathlib import Path
import pymupdf
from PIL import Image

document = pymupdf.open('C:/Users/pc/Downloads/ملف مسار.pdf')
Path('public/images').mkdir(parents=True, exist_ok=True)
for xref, mask, dest, crop in [
    (45, 1203, 'public/brand/masar-white.png', True),
    (169, 1482, 'public/brand/masar-navy.png', True),
    (155, 0, 'docs/reference/device-reference.png', False),
    (156, 1457, 'docs/reference/device-exploded.png', True),
]:
    pix = pymupdf.Pixmap(document, xref)
    if mask:
        pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(document, mask))
    pix.save(dest)
    if crop:
        im = Image.open(dest)
        bbox = im.getbbox()
        if bbox:
            im.crop(bbox).save(dest)
    print(dest, Image.open(dest).size)
