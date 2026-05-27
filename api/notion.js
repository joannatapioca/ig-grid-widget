export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const response = await fetch(
    `https://api.notion.com/v1/databases/${process.env.NOTION_DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_size: 60 })
    }
  )
  const data = await response.json()

  // Normalize status field — works for both Select and Status property types
  const normalized = {
    ...data,
    results: data.results.map(page => {
      const statusProp = page.properties.Status
      const statusName =
        statusProp?.select?.name ||
        statusProp?.status?.name ||
        "Draft"
      return {
        ...page,
        properties: {
          ...page.properties,
          Status: {
            ...statusProp,
            select: { name: statusName }
          }
        }
      }
    })
  }

  res.status(200).json(normalized)
}
