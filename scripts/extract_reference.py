from pathlib import Path
import pymupdf

source = Path('C:/Users/pc/Downloads/ملف مسار.pdf')
out = Path('docs/reference')
document = pymupdf.open(source)
texts = []
print('Pages:', len(document))
for index, page in enumerate(document):
    text = page.get_text()
    texts.append(f'\n--- PAGE {index + 1} ---\n{text}')
    page.get_pixmap(matrix=pymupdf.Matrix(0.8, 0.8)).save(out / f'page-{index + 1:02}.png')
    print(index + 1, page.rect, 'text chars', len(text), 'images', len(page.get_images()))
(out / 'pdf-text.txt').write_text(''.join(texts), encoding='utf-8')
