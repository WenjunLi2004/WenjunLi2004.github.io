const SCHOLAR_URL = "https://scholar.google.com/citations?user=2UoMP0kAAAAJ";

const HOST_ROUTES = {
  "cv.wenjun.li": { target: "https://wenjun.li/cv/", preservePath: true },
  "notes.wenjun.li": { target: "https://wenjun.li/notes/", preservePath: true },
  "blog.wenjun.li": { target: "https://wenjun.li/blog/", preservePath: true },
  "github.wenjun.li": { target: "https://wenjun.li/github/" },
  "scholar.wenjun.li": { target: SCHOLAR_URL },
  "lehome.wenjun.li": { target: "https://wenjun.li/paper/lehome/" },
  "paper.wenjun.li": { target: "https://wenjun.li/paper/lehome/pdf/" },
};

const GO_ROUTES = {
  cv: "https://wenjun.li/cv/",
  github: "https://wenjun.li/github/",
  scholar: SCHOLAR_URL,
  lehome: "https://wenjun.li/paper/lehome/",
  paper: "https://wenjun.li/paper/lehome/pdf/",
  lehomepdf: "https://wenjun.li/paper/lehome/pdf/",
  notes: "https://wenjun.li/notes/",
  blog: "https://wenjun.li/blog/",
  honors: "https://wenjun.li/honors.html",
};

const withPreservedPath = (target, sourceUrl) => {
  const destination = new URL(target);
  const sourcePath = sourceUrl.pathname.replace(/^\/+/, "");

  if (sourcePath) {
    destination.pathname = `${destination.pathname.replace(/\/$/, "")}/${sourcePath}`;
  }

  destination.search = sourceUrl.search;
  return destination.toString();
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host === "go.wenjun.li") {
      const key = url.pathname.split("/").filter(Boolean)[0] || "cv";
      const target = GO_ROUTES[key];

      if (target) {
        const destination = new URL(target);
        url.searchParams.forEach((value, key) => {
          destination.searchParams.set(key, value);
        });
        return Response.redirect(destination.toString(), 302);
      }

      return Response.redirect("https://wenjun.li/", 302);
    }

    const route = HOST_ROUTES[host];

    if (route) {
      const destination = route.preservePath ? withPreservedPath(route.target, url) : route.target;
      return Response.redirect(destination, 302);
    }

    return Response.redirect("https://wenjun.li/", 302);
  },
};
