const fs = require('fs')
require('dotenv').config()

const API_KEY = process.env.GNEWS_API_KEY

async function getNews() {
  const url = `https://gnews.io/api/v4/top-headlines?category=sports&lang=es&max=1&apikey=${API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  console.log(data)

  const article = data.articles[0]

  if (!article) {
    console.log('No se encontraron noticias')
    return
  }

  const content = `---
title: '${article.title.replace(/'/g, '')}'
date: '${new Date().toISOString().split('T')[0]}'
tags: ['Deportes']
draft: false
summary: '${(article.description || '').replace(/'/g, '')}'
---

${article.content || article.description || ''}
`

  const fileName = `data/blog/noticia-${Date.now()}.mdx`

  fs.writeFileSync(fileName, content)

  console.log('Noticia creada:', fileName)
}

getNews()
