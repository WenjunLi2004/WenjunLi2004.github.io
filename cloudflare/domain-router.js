const HOST_ROUTES = {
  "cv.wenjun.li": { target: "https://wenjun.li/cv/", preservePath: true },
  "notes.wenjun.li": { target: "https://wenjun.li/notes/", preservePath: true },
  "blog.wenjun.li": { target: "https://wenjun.li/blog/", preservePath: true },
  "github.wenjun.li": { target: "https://wenjun.li/github/" },
  "scholar.wenjun.li": { target: "https://wenjun.li/scholar/" },
  "lehome.wenjun.li": { target: "https://wenjun.li/lehome/" },
  "paper.wenjun.li": { target: "https://wenjun.li/paper/lehome/" },
};

const GO_ROUTES = {
  cv: "https://wenjun.li/cv/",
  github: "https://wenjun.li/github/",
  scholar: "https://wenjun.li/scholar/",
  lehome: "https://wenjun.li/lehome/",
  paper: "https://wenjun.li/paper/lehome/",
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
        destination.search = url.search;
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
