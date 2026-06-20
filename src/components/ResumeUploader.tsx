'use client'

import { useRef, useState } from 'react'
import { saveResume } from '@/lib/storage'

interface ResumeUploaderProps {
  onExtracted: (text: string, fileName: string) => void
  label?: string
}

export function ResumeUploader({ onExtracted, label = '上传简历' }: ResumeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setError('')
    setParsing(true)

    try {
      let text = ''

      if (file.name.endsWith('.txt')) {
        text = await file.text()
      } else if (file.name.endsWith('.pdf')) {
        text = await extractPDFText(file)
      } else if (file.name.endsWith('.docx')) {
        text = await extractDocxText(file)
      } else {
        // Try as text anyway
        text = await file.text()
      }

      if (!text.trim()) {
        throw new Error('未能从文件中提取到文本内容')
      }

      // Save to storage
      const name = file.name.replace(/\.(pdf|docx|txt)$/i, '')
      saveResume(name, text)

      onExtracted(text, name)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '解析失败'
      setError(msg)
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={handleClick}
        className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={handleInputChange}
        />
        {parsing ? (
          <div className="text-slate-400 text-sm">
            <span className="animate-spin inline-block mr-2">⏳</span>
            解析中...
          </div>
        ) : (
          <div>
            <div className="text-2xl mb-1">📄</div>
            <p className="text-sm text-slate-400 group-hover:text-blue-300 transition-colors">
              {label}
            </p>
            <p className="text-xs text-slate-600 mt-1">支持 PDF / TXT / DOCX，拖拽或点击上传</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}

// PDF text extraction using pdf.js
async function extractPDFText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')

  // Set worker source
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n\n'
  }

  return fullText.trim()
}

// DOCX text extraction (client-side, simple approach)
async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  // DOCX is a ZIP file containing XML. Try to extract text from word/document.xml
  try {
    // Use a simple approach: read as ZIP, get document.xml, extract text
    const JSZip = await import('jszip')
    const zip = await JSZip.loadAsync(arrayBuffer)
    const docFile = zip.file('word/document.xml')
    if (!docFile) throw new Error('无法解析 DOCX 文件结构')
    const xmlContent = await docFile.async('text')
    // Extract text from XML
    const textMatch = xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return textMatch || '未能提取到文本'
  } catch {
    throw new Error('DOCX 解析失败，请保存为 TXT 或 PDF 后重试')
  }
}
