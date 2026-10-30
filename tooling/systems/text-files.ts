// Which of a system's supporting files are text, which the studio shows as
// written (a script in a skill's folder), and which are binary (pictures,
// fonts, archives), which it leaves to other programs. Shared by the build,
// which ships text files, and the app, which gives them addresses; only
// plain functions, so both can load it.

const BINARY = new Set(
  [
    'png jpg jpeg gif webp avif bmp ico tif tiff heic psd ai sketch fig',
    'woff woff2 ttf otf eot',
    'zip gz tgz bz2 xz 7z rar tar jar',
    'pdf doc docx xls xlsx ppt pptx key numbers pages',
    'mp3 wav ogg flac m4a aac mp4 mov webm avi mkv',
    'exe dll so dylib bin wasm class pyc node db sqlite',
  ]
    .join(' ')
    .split(' '),
)

/** Whether a file's name says it is binary, whatever it holds. */
export function isBinaryFile(file: string) {
  const name = file.split('/').at(-1) ?? ''
  const dot = name.lastIndexOf('.')
  return dot > 0 && BINARY.has(name.slice(dot + 1).toLowerCase())
}

/** Whether content read from disk is text: no NUL bytes, valid UTF-8. */
export function isTextContent(content: Uint8Array) {
  if (content.includes(0)) return false
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(content)
    return true
  } catch {
    return false
  }
}
