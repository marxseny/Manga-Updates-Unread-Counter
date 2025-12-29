export function query(selector, parent = document) {
  return parent.querySelector(selector);
}

export function queryAll(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

export function getElementText(element) {
  return element ? element.textContent.trim() : "";
}

export function setElementText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

export function setElementHTML(element, html) {
  if (element) {
    element.innerHTML = html;
  }
}

export function createElement(tag, properties = {}) {
  const el = document.createElement(tag);
  Object.entries(properties).forEach(([key, value]) => {
    // CSP Compliance: Avoid inline styles where possible
    if (key === 'className') {
      el.className = value;
    } else if (key === 'textContent') {
      el.textContent = value;
    } else if (key !== 'style') {
      el.setAttribute(key, value);
    }
  });
  return el;
}

export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

export function appendChild(parent, child) {
  if (parent && child) {
    parent.appendChild(child);
  }
}

export function clearChildren(element) {
  if (element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}