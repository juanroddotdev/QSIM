#!/usr/bin/env node

/**
 * Sync Mermaid diagrams from markdown files to index.html
 * This script reads the .md files and updates the HTML with the actual diagrams
 */

const fs = require('fs');
const path = require('path');

const docsDir = __dirname;
const htmlFile = path.join(docsDir, 'index.html');

// Map markdown files to their HTML sections
const diagramMap = {
  'ARCHITECTURE.md': {
    id: 'architecture',
    title: 'System Architecture'
  },
  'DATA_FLOW.md': {
    id: 'data-flow',
    title: 'Data Flow'
  },
  'USER_WORKFLOW.md': {
    id: 'user-workflow',
    title: 'User Workflow'
  },
  'INVENTORY_MANAGEMENT.md': {
    id: 'management',
    title: 'Inventory Management'
  },
  'NEW_PRODUCT_RECEIVING.md': {
    id: 'newProductReceiving',
    title: 'New Product Receiving'
  },
  'SKU_STRAT_KITS.md': {
    id: 'skuStrategy',
    title: 'SKU Strategy for Complex Fabric Kits'
  }
};

/**
 * Extract Mermaid code block from markdown file
 */
function extractMermaidFromMarkdown(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/;
    const match = content.match(mermaidRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    console.warn(`No Mermaid diagram found in ${path.basename(filePath)}`);
    return null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Update HTML file with diagrams from markdown files
 */
function syncDiagramsToHTML() {
  // Read the HTML template
  let htmlContent = fs.readFileSync(htmlFile, 'utf8');
  
  // Extract diagrams from markdown files
  const diagrams = {};
  for (const [mdFile, config] of Object.entries(diagramMap)) {
    const mdPath = path.join(docsDir, mdFile);
    const diagram = extractMermaidFromMarkdown(mdPath);
    if (diagram) {
      diagrams[config.id] = diagram;
    }
  }
  
  // Replace each diagram section in HTML
  for (const [id, diagram] of Object.entries(diagrams)) {
    // Find the mermaid div for this section
    const sectionRegex = new RegExp(
      `(<div class="container" id="${id}">[\\s\\S]*?<div class="mermaid">)[\\s\\S]*?(</div>[\\s\\S]*?</div>)`,
      'i'
    );
    
    // Indent the diagram code properly (8 spaces to match HTML indentation)
    const indentedDiagram = diagram.split('\n').map(line => '        ' + line).join('\n');
    const replacement = `$1\n${indentedDiagram}\n      $2`;
    htmlContent = htmlContent.replace(sectionRegex, replacement);
  }
  
  // Write updated HTML
  fs.writeFileSync(htmlFile, htmlContent, 'utf8');
  console.log('✅ Successfully synced diagrams to index.html');
  console.log(`   Updated ${Object.keys(diagrams).length} diagrams`);
}

// Run the sync
syncDiagramsToHTML();

