import fs from 'fs'
import path from 'path'

const GNEWS_API_KEY = process.env.GNEWS_API_KEY
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY

async function getBarcelonaNews() {
  const url = `https://gnews.io/api/v4/search?q=FC%20Barcelona&lang=es&max=1&apikey=${GNEWS_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  return data.articles?.[0]
}

async function rewriteWithAI(article) {
  const originalText = `
Título: ${article.title}

Descripción:
${article.description}

Contenido:
${article.content}
`

  const prompt = `
Eres un periodista deportivo profesional especializado exclusivamente en noticias del FC Barcelona.

Tu trabajo es reescribir noticias deportivas en español de forma:
- Natural
- Humana
- Profesional
- Moderna
- Fácil de leer desde móvil

Reglas IMPORTANTES:
- NO copies el texto original.
- NO inventes información falsa.
- Mantén los datos importantes reales.
- Escribe titulares llamativos.
- Usa párrafos cortos.
- Tono emocionante pero profesional.
- Optimizado para blogs deportivos.
- Máximo 350 palabras.
- Agrega una conclusión final corta.
- Evita sonar robótico o generado por IA.

La noticia original es:

${originalText}

Devuelve EXACTAMENTE este formato:

TITULO:
(título aquí)

CONTENIDO:
(contenido aquí en markdown)
`

  const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  })

  const data = await response.json()

  const text =
    data?.choices?.[0]?.message?.content ||
    'TITULO:\nNoticia Barcelona\n\nCONTENIDO:\nError generando noticia.'

  return text
}

function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

function cleanText(text) {
  return text
    .replace(/"/g, "'")
    .replace(/:/g, '')
    .replace(/\n/g, ' ')
    .trim()
}

async function savePost(aiText) {
  const titleMatch = aiText.match(/TITULO:\s*(.*)/)
  const contentMatch = aiText.match(/CONTENIDO:\s*([\s\S]*)/)

  const rawTitle = titleMatch?.[1]?.trim() || 'Noticia Barcelona'
  const content = contentMatch?.[1]?.trim() || 'Sin contenido.'

  const title = cleanText(rawTitle)

  const slug = createSlug(title)

  const today = new Date().toISOString().split('T')[0]

  const mdx = `---
title: '${title}'
date: '${today}'
tags: ['Barcelona', 'LaLiga']
draft: false
summary: '${title}'
---

${content}
`

  const filePath = path.join(process.cwd(), 'data', 'blog', `${slug}.mdx`)

  fs.writeFileSync(filePath, mdx)

  console.log('✅ Noticia creada:', filePath)
}

async function main() {
  try {
    console.log('🔍 Buscando noticia del Barcelona...')

    const article = await getBarcelonaNews()

    if (!article) {
      console.log('❌ No se encontraron noticias.')
      return
    }

    console.log('🤖 Reescribiendo con IA...')

    const aiText = await rewriteWithAI(article)

    console.log('💾 Guardando noticia...')

    await savePost(aiText)

    console.log('🚀 Todo listo.')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()
