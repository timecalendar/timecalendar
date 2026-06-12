// Jest can't transform CSS (global.css / *.module.css are Metro/web concerns).
// Map every CSS import to this empty stub so component modules load under tests.
module.exports = {}
