// Backtick char for code block detection
const BACKTICK = String.fromCharCode(96, 96, 96);
// Word regex pattern: [\w']+
const WORD_PATTERN = String.fromCharCode(91, 92, 92, 119, 39, 93, 43);

// Pattern for blocks that are NOT code (excludes ```, {{, <%, >, [[>]], :q )
const NOT_CODE = `(not (or [(clojure.string/starts-with? ?s "${BACKTICK}")]
            [(clojure.string/starts-with? ?s "{{")]
            [(clojure.string/starts-with? ?s "<%")]
            [(clojure.string/starts-with? ?s "> ")]
            [(clojure.string/starts-with? ?s "[[>]] ")]
            [(clojure.string/starts-with? ?s ":q ")]))`;

// Pattern for code blocks (```, {{, <%, :q )
const IS_CODE = `(or [(clojure.string/starts-with? ?s "${BACKTICK}")]
       [(clojure.string/starts-with? ?s "{{")]
       [(clojure.string/starts-with? ?s "<%")]
       [(clojure.string/starts-with? ?s ":q ")])`;

// Pattern for blockquotes (>, [[>]])
const IS_BLOCKQUOTE = `(or [(clojure.string/starts-with? ?s "[[>]] ")]
       [(clojure.string/starts-with? ?s "> ")])`;

// --- Pages ---

export const queryPages = `[:find (count ?p) :where [?p :node/title _]]`;

// --- Text blocks (non-code) ---

export const queryNonCodeBlocks = `[:find (count ?s) . :with ?e :where
   [?e :block/string ?s]
   ${NOT_CODE}]`;

export const queryNonCodeBlockWords = `[:find (sum ?n) :with ?e :where
   (or-join [?s ?e]
     (and [?e :block/string ?s] ${NOT_CODE})
     [?e :node/title ?s])
   [(re-pattern "${WORD_PATTERN}") ?pattern]
   [(re-seq ?pattern ?s) ?w]
   [(count ?w) ?n]]`;

export const queryNonCodeBlockCharacters = `[:find (sum ?size) . :with ?e :where
   (or-join [?s ?e]
     (and [?e :block/string ?s] ${NOT_CODE})
     [?e :node/title ?s])
   [(count ?s) ?size]]`;

// --- Code blocks ---

export const queryCodeBlocks = `[:find (count ?s) . :with ?e :where
   [?e :block/string ?s]
   ${IS_CODE}]`;

export const queryCodeBlockCharacters = `[:find (sum ?size) . :with ?e :where
   [?e :block/string ?s]
   ${IS_CODE}
   [(count ?s) ?size]]`;

// --- Blockquotes ---

export const queryBlockquotes = `[:find (count ?s) . :with ?e :where
   [?e :block/string ?s]
   ${IS_BLOCKQUOTE}]`;

export const queryBlockquotesWords = `[:find (sum ?n) :with ?e :where
   (or-join [?s ?e]
     (and [?e :block/string ?s] ${IS_BLOCKQUOTE})
     [?e :node/title ?s])
   [(re-pattern "${WORD_PATTERN}") ?pattern]
   [(re-seq ?pattern ?s) ?w]
   [(count ?w) ?n]]`;

export const queryBlockquotesCharacters = `[:find (sum ?size) . :with ?e :where
   (or-join [?s ?e]
     (and [?e :block/string ?s] ${IS_BLOCKQUOTE})
     [?e :node/title ?s])
   [(count ?s) ?size]]`;

// --- Refs & tags ---

export const queryInterconnections = `[:find (count ?r) . :with ?e :where [?e :block/refs ?r]]`;

export const queryTagRefs = (tag: string) =>
  `[:find (count ?be) . :where [?e :node/title "${tag}"][?be :block/refs ?e]]`;

// --- Links ---

export const queryFireBaseAttachements = `[:find (count ?e) . :where
   [?e :block/string ?s]
   [(clojure.string/includes? ?s "https://firebasestorage.googleapis.com")]]`;

export const queryExternalLinks = `[:find (count ?e) . :where
   [?e :block/string ?s]
   (not [(clojure.string/includes? ?s "https://firebasestorage.googleapis.com")])
   (or [(clojure.string/includes? ?s "https://")]
       [(clojure.string/includes? ?s "http://")])]`;

/** Run a Datalog query using data.async.q. Returns a Promise. */
export const runQuery = (query: string) =>
  window.roamAlphaAPI.data.async.q(query);
