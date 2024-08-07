import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Upload, ChevronUp, ChevronDown } from 'lucide-react';

const Index = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setPdfFiles((prevFiles) => [
      ...prevFiles,
      ...acceptedFiles.map((file) => ({ id: Date.now() + Math.random(), file }))
    ]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const moveFile = (index, direction) => {
    const newFiles = [...pdfFiles];
    if (direction === 'up' && index > 0) {
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    } else if (direction === 'down' && index < newFiles.length - 1) {
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    }
    setPdfFiles(newFiles);
  };

  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      setError('Please upload at least two PDF files to merge.');
      return;
    }

    try {
      const mergedPdf = await PDFDocument.create();

      for (const { file } of pdfFiles) {
        const pdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      setError(null);
    } catch (err) {
      setError('An error occurred while merging PDFs. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-8">PDF Merger</h1>
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-lg">Drop the PDF files here...</p>
        ) : (
          <div>
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg">Drag 'n' drop PDF files here, or click to select files</p>
          </div>
        )}
      </div>
      {pdfFiles.length > 0 && (
        <div className="mb-8 w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Uploaded Files:</h2>
          <ul className="space-y-2">
            {pdfFiles.map(({ id, file }, index) => (
              <li key={id} className="flex items-center bg-white p-2 rounded shadow">
                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                <span className="truncate flex-grow">{file.name}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === pdfFiles.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button onClick={mergePDFs} disabled={pdfFiles.length < 2}>
        Merge PDFs
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {mergedPdfUrl && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Merged PDF:</h2>
          <Button asChild>
            <a href={mergedPdfUrl} download="merged.pdf">
              Download Merged PDF
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
