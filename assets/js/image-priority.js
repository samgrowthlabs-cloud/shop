const prioritize=image=>{
  if(!(image instanceof HTMLImageElement))return;
  image.loading='eager';
  image.fetchPriority='high';
};

const prioritizeTree=root=>{
  if(root instanceof HTMLImageElement)prioritize(root);
  root.querySelectorAll?.('img').forEach(prioritize);
};

prioritizeTree(document);

new MutationObserver(records=>{
  records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType===Node.ELEMENT_NODE)prioritizeTree(node);
  }));
}).observe(document.documentElement,{childList:true,subtree:true});