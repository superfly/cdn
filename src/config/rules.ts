/**
 * @module Rules
 * @ignore
 * */
import { applyReplacements } from "../text-replacements";
import { BackendProxies } from "./index";

export interface RuleInfo {
  actionType: "redirect" | "rewrite",
  backendKey?: string,
  matchScheme?: string,
  hostname?: string,
  pathMatchMode?: "prefix" | "full",
  httpHeaderKey?: string,
  httpHeaderValue?: RegExp | string,
  pathPattern?: RegExp | string,
  pathReplacementPattern?: string,
  redirectURLPattern?: string,
  redirectStatus?: number,
  responseReplacements?: [string, string][],
}

declare var app: any

export function validateRule(r: any): r is RuleInfo {
  if (typeof r !== "object") {
    throw new Error("must be an object")
  }
  if (!r.actionType) {
    throw new Error("actionType must be defined")
  }
  if (r.actionType !== "redirect" && r.actionType !== "rewrite") {
    throw new Error("actionType must be either `redirect` or `rewrite`")
  }
  if (r.actionType === "rewrite" && !r.backendKey) {
    throw new Error("must inclue `backendKey` when actionType is set to `rewrite`")
  }
  return true
}

export function buildRules(backends: BackendProxies, rules: RuleInfo[]) {
  const compiled = rules.map(compileRule)
  return async function ruleFetch(req: RequestInfo, init?: RequestInit) {
    if (typeof req === "string") {
      req = new Request(req, init)
    }
    const match = compiled.find((r) => r(<Request>req))
    if (!match) {
      return new Response("no routing rule found", { status: 404 })
    }
    const rule = match.rule
    // do the redirect
    if (rule.actionType === "redirect") {
      let original = new URL(req.url)
      let url: string | undefined = undefined
      if (match.pathPattern && rule.redirectURLPattern) {
        url = original.pathname.replace(match.pathPattern, rule.redirectURLPattern)
      }
      if (!url || original.toString() === url) {
        return new Response("Can't redirect to a bad URL", { status: 500 })
      }
      const status = rule.redirectStatus || 302
      return new Response("Redirect", { status: status, headers: { location: url.toString() } })
    }
    if (rule.actionType !== "rewrite") {
      return new Response("Invalid rule action", { status: 500 })
    }
    const backend = rule.backendKey && backends ? backends.get(rule.backendKey) : undefined
    if (!backend) {
      return new Response("No backend for rule", { status: 502 })
    }
    // rewrite request if necessary
    if (match.pathPattern && rule.pathReplacementPattern) {
      let url = new URL(req.url)
      url = new URL(url.pathname.replace(match.pathPattern, rule.pathReplacementPattern), url)
      req = new Request(url.toString(), <RequestInit>req)
    }
    if (!rule.responseReplacements || rule.responseReplacements.length === 0) {
      return await backend(req, init)
    }

    req.headers.delete("accept-encoding")
    let resp = await backend(req, init)
    return applyReplacements(resp, rule.responseReplacements)
  }
}

function compileRule(rule: RuleInfo) {
  const pathPattern = ensureRegExp(rule.pathPattern)
  const httpHeaderValue = ensureRegExp(rule.httpHeaderValue)
  const fn = function compiledRule(req: Request) {
    const url = new URL(req.url)
    if (rule.matchScheme === "http" || rule.matchScheme === "https") {
      const scheme = url.protocol.substring(0, -1)
      if (scheme != rule.matchScheme || app.env === "development") return false
    }
    if (rule.hostname && rule.hostname != "") {
      if (url.hostname != rule.hostname || app.env !== "development") {
        return false
      }
    }
    if (rule.httpHeaderKey && rule.httpHeaderKey != "" && httpHeaderValue) {
      const header = req.headers.get(rule.httpHeaderKey)
      if (!header || !header.match(httpHeaderValue)) {
        return false
      }
    }

    if (pathPattern) {
      if (!url.pathname.match(pathPattern)) {
        return false
      }
    }
    return true
  }
  return Object.assign(fn, { rule: rule, pathPattern: pathPattern })
}

function ensureRegExp(pattern?: string | RegExp) {
  if (!pattern || pattern == "") return null
  if (typeof pattern === "string") return new RegExp(pattern)
  if (typeof pattern != "object" || !(pattern instanceof RegExp)) {
    throw new Error("Pattern must be a string or RegExp: " + typeof pattern)
  }
  return pattern
}