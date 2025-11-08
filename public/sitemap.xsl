<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap - Revillion Partners</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #1a1a1a;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .intro {
            color: #666;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #8B5CF6;
            color: white;
            text-align: left;
            padding: 12px;
            font-weight: 600;
            font-size: 14px;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
          }
          tr:hover {
            background-color: #f9f9f9;
          }
          a {
            color: #8B5CF6;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .url {
            word-break: break-all;
          }
          .stats {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 4px;
            font-size: 14px;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          .priority-high {
            background-color: #dcfce7;
            color: #16a34a;
          }
          .priority-medium {
            background-color: #fef3c7;
            color: #ca8a04;
          }
          .priority-low {
            background-color: #f3f4f6;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🗺️ XML Sitemap</h1>
          <div class="intro">
            <p>This is a XML Sitemap for search engines like Google, Bing, and others.</p>
            <p>Total URLs: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong></p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">URL</th>
                <th style="width: 15%;">Last Modified</th>
                <th style="width: 15%;">Change Frequency</th>
                <th style="width: 10%;">Priority</th>
                <th style="width: 10%;">Languages</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td class="url">
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:variable name="priority" select="sitemap:priority"/>
                    <xsl:choose>
                      <xsl:when test="$priority &gt;= 0.9">
                        <span class="badge priority-high">
                          <xsl:value-of select="$priority"/>
                        </span>
                      </xsl:when>
                      <xsl:when test="$priority &gt;= 0.7">
                        <span class="badge priority-medium">
                          <xsl:value-of select="$priority"/>
                        </span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="badge priority-low">
                          <xsl:value-of select="$priority"/>
                        </span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td>
                    <xsl:value-of select="count(xhtml:link)"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          
          <div class="stats">
            <strong>Note:</strong> This XML Sitemap is generated dynamically and updated automatically when new content is published.
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
