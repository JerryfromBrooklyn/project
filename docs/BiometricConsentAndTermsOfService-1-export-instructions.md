# Instructions for Exporting the Biometric Consent and Terms of Service to PDF

Since we were unable to directly create a PDF from the command line, here are several methods you can use to create a well-formatted PDF from the Markdown file:

## Option 1: Using Visual Studio Code (Recommended)

1. Open `docs/BiometricConsentAndTermsOfService-1.md` in Visual Studio Code
2. Install the "Markdown PDF" extension:
   - Click on the Extensions icon in the left sidebar
   - Search for "Markdown PDF"
   - Install the extension by "yzane"
3. Right-click on the open file
4. Select "Markdown PDF: Export (PDF)"
5. The PDF will be created in the same folder

## Option 2: Using Pandoc with LaTeX (Best Quality)

1. Install required tools:
   ```bash
   # On macOS
   brew install pandoc
   brew install --cask basictex
   # Add TeX to path
   export PATH="$PATH:/Library/TeX/texbin"
   ```

2. Convert the Markdown to PDF:
   ```bash
   pandoc docs/BiometricConsentAndTermsOfService-1.md -o docs/BiometricConsentAndTermsOfService-1.pdf --pdf-engine=pdflatex -V geometry:"margin=1in" -V colorlinks=true -V linkcolor=blue -V urlcolor=blue -V toccolor=blue --toc --toc-depth=3
   ```

## Option 3: Using Online Tools

1. Copy the content of `docs/BiometricConsentAndTermsOfService-1.md`
2. Visit an online Markdown to PDF converter like:
   - [MD2PDF](https://md2pdf.netlify.app/)
   - [Markdown to PDF](https://www.markdowntopdf.com/)
   - [CloudConvert](https://cloudconvert.com/md-to-pdf)
3. Paste the content and download the PDF
4. Save the PDF to the `docs/` folder

## Option 4: Using a Word Processor

1. Open `docs/BiometricConsentAndTermsOfService-1.md` in a text editor
2. Copy all content
3. Paste into Microsoft Word, Google Docs, or Pages
4. Format as needed
5. Export/Save as PDF
6. Save the PDF to the `docs/` folder

## Formatting Recommendations

For a professional-looking legal document:

- Use a clean, professional font like Helvetica, Arial, or Times New Roman
- Set reasonable margins (1 inch on all sides)
- Include a table of contents
- Use consistent heading styles
- Include page numbers in the footer
- Add the date of generation in the header or footer
- Consider adding your company logo to the header of the first page

After generating the PDF, review it carefully to ensure all formatting is preserved and the document looks professional. 