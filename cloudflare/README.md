# Cloudflare Domain Routing

This Worker turns subdomains into durable redirects:

- `cv.wenjun.li` -> `https://wenjun.li/cv/`
- `github.wenjun.li` -> `https://wenjun.li/github/`
- `scholar.wenjun.li` -> `https://wenjun.li/scholar/`
- `lehome.wenjun.li` -> `https://wenjun.li/lehome/`
- `paper.wenjun.li` -> `https://wenjun.li/paper/lehome/`
- `notes.wenjun.li` -> `https://wenjun.li/notes/`
- `blog.wenjun.li` -> `https://wenjun.li/blog/`
- `go.wenjun.li/cv`, `go.wenjun.li/github`, etc. -> matching short links

## Deploy

```bash
cd cloudflare
cp wrangler.toml.example wrangler.toml
npx wrangler@latest login
npx wrangler@latest deploy
```

Cloudflare DNS must contain proxied records for these hosts. The compact setup is:

```text
Type   Name      Target      Proxy
CNAME  cv        wenjun.li   Proxied
CNAME  github    wenjun.li   Proxied
CNAME  scholar   wenjun.li   Proxied
CNAME  lehome    wenjun.li   Proxied
CNAME  paper     wenjun.li   Proxied
CNAME  notes     wenjun.li   Proxied
CNAME  blog      wenjun.li   Proxied
CNAME  go        wenjun.li   Proxied
```

Email routing is separate from the Worker. In Cloudflare, enable Email Routing and forward addresses such as
`wenjun@wenjun.li` or `hi@wenjun.li` to the current mailbox. Cloudflare will show the required MX/TXT records
when the feature is enabled.
