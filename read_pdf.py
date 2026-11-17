import fitz
doc = fitz.open('Proyectos_EDO_U3 (1).pdf')
for i, page in enumerate(doc):
    text = page.get_text()
    print(f'=== Página {i+1} ===')
    print(text[:3000])
    print('...')