import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Upload, ChevronUp, ChevronDown, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const Index = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfPages, setPdfPages] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setPdfFiles((prevFiles) => [
      ...prevFiles,
      ...acceptedFiles.map((file) => ({ id: Date.now() + Math.random(), file }))
    ]);
    setError(null);
  }, []);

  useEffect(() => {
    const loadPdfPages = async () => {
      const newPages = [];
      for (const { id, file } of pdfFiles) {
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const pageCount = pdfDoc.getPageCount();
        for (let i = 0; i < pageCount; i++) {
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          newPages.push({ id: `${id}-${i}`, url, pageNumber: i + 1, fileName: file.name });
        }
      }
      setPdfPages(newPages);
    };

    loadPdfPages();
  }, [pdfFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(pdfPages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPdfPages(items);
  };

  const removePage = (pageId) => {
    setPdfPages((prevPages) => prevPages.filter((page) => page.id !== pageId));
  };

  const mergePDFs = async () => {
    if (pdfPages.length < 2) {
      setError('Please upload at least two PDF pages to merge.');
      return;
    }

    try {
      const mergedPdf = await PDFDocument.create();

      for (const page of pdfPages) {
        const pdfDoc = await PDFDocument.load(await fetch(page.url).then(res => res.arrayBuffer()));
        const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [page.pageNumber - 1]);
        mergedPdf.addPage(copiedPage);
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
      {pdfPages.length > 0 && (
        <div className="mb-8 w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4">PDF Pages:</h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="pdfPages" direction="horizontal">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="flex flex-wrap gap-4">
                  {pdfPages.map((page, index) => (
                    <Draggable key={page.id} draggableId={page.id} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative bg-white p-2 rounded shadow"
                        >
                          <img src={page.url} alt={`Page ${page.pageNumber}`} className="w-32 h-40 object-cover" />
                          <div className="absolute top-0 right-0 p-1">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removePage(page.id)}
                              className="h-6 w-6"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs mt-1 text-center">{`${page.fileName} - Page ${page.pageNumber}`}</p>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      <Button onClick={mergePDFs} disabled={pdfPages.length < 2}>
        Merge PDF Pages
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
