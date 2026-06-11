const getSiteRelativePath = (resolvedPathname) => {
  let path = resolvedPathname;
  const match = path.match(/[\/\\](phileasdg\.github\.io|newsite)/i);
  if (match) {
    path = path.substring(match.index + match[0].length);
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path;
};

const getSiteBasePath = (pathname) => {
  const siteRelative = getSiteRelativePath(pathname);
  const base = pathname.substring(0, pathname.length - siteRelative.length);
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const testUrls = [
  "http://127.0.0.1:8000/",
  "http://127.0.0.1:8000/index.html",
  "http://127.0.0.1:8000/pages/playgrounds/",
  "http://127.0.0.1:8000/posts/tracking-icebergs/",
  "https://phileasdg.github.io/",
  "https://phileasdg.github.io/index.html",
  "https://phileasdg.github.io/pages/playgrounds/",
  "https://phileasdg.github.io/posts/tracking-icebergs/",
  "file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/index.html",
  "file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/pages/playgrounds/index.html"
];

testUrls.forEach(urlStr => {
  const url = new URL(urlStr);
  const pathname = url.pathname;
  const siteRelative = getSiteRelativePath(pathname);
  const basePath = getSiteBasePath(pathname);
  const prefix = basePath ? basePath + '/' : '/';
  
  const thumbnail = "media/imgs/hypergraph-plotter.png";
  const postThumbnail = "media/posts/tracking-icebergs/Iceberg_Ilulissat.jpg";
  
  const imgCardUrl = `${prefix}${thumbnail}`;
  const imgPostUrl = `${prefix}${postThumbnail}`;
  const playgroundImgUrl = `${basePath}/${thumbnail}`;

  console.log(`URL: ${urlStr}`);
  console.log(`  pathname:     ${pathname}`);
  console.log(`  siteRelative: ${siteRelative}`);
  console.log(`  basePath:     ${basePath}`);
  console.log(`  prefix:       ${prefix}`);
  console.log(`  imgCardUrl:   ${imgCardUrl}`);
  console.log(`  imgPostUrl:   ${imgPostUrl}`);
  console.log(`  playgImgUrl:  ${playgroundImgUrl}`);
  console.log();
});
