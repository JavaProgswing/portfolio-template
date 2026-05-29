// Copy this file to me.ts and fill in your details.
// cp src/data/me.example.ts src/data/me.ts

export default {
  // Your full name — used in title, footer, navbar logo, and AI chat.
  name: "Your Name",

  // Direct URL to your profile photo.
  image: "https://your-image-url.com/photo.jpg",

  // Path to resume PDF (optional). Two options:
  //  1. Put resume.pdf in public/ and reference "/resume.pdf"
  //  2. Use an external URL (Google Drive, Dropbox, etc.)
  //  Leave "" to hide the /resume page.
  resumeUrl: "/resume.pdf",

  // Pinned projects — shown FIRST in "What I've Built" before auto-ranked repos.
  // Great for active PRs, GSoC work, anything you want highlighted regardless of stars.
  // Leave [] to skip.
  pinnedProjects: [
    {
      name: "Project · Subtitle",
      description: "Why it matters, in one sentence.",
      repoUrl: "https://github.com/owner/repo",
      prUrl: "https://github.com/owner/repo/pull/123",  // optional
      language: "TypeScript",
      badge: "Featured",  // optional pill text
      skills: ["TypeScript", "React"],
    },
  ],

  // Max cards in the auto-ranked grid (pinned always show on top, not counted).
  // 0 or omit = show all.
  maxProjects: 9,

  // Custom projects merged INTO the auto-ranked grid by `score` (not pinned-on-top).
  // For private repos, other accounts, GitLab, or non-code work the script can't see.
  // `score` competes with auto-fetched scores (~15-60). Higher = higher in the grid.
  customProjects: [
    // {
    //   name: "My Private Tool",
    //   description: "What it does, in one line.",
    //   url: "https://github.com/you/tool",
    //   homepage: "",
    //   language: "Rust",
    //   stars: 0,
    //   forks: 0,
    //   score: 35,
    // },
  ],

  // Auto-ranking filters for "What I've Built" (used by scripts/fetch-repos.mjs).
  //  excludeRepos: exact repo names to NEVER show — old/throwaway side projects.
  //                Also applied at display time (hides instantly, no re-fetch needed).
  //  includeRepos: forks to force-include despite being forks (e.g. a GSoC fork
  //                where you opened PRs / fixed issues). Gets a score boost.
  excludeRepos: ["old-tutorial-project", "first-website"],
  includeRepos: [],

  // Planning — shown at top of /guestbook so visitors know what's next.
  planning: [
    "What you're shipping this month",
    "Bigger goal for the quarter",
    "Stretch goal",
  ],

  // Homelab — "how this site runs". Rendered on /colophon. Omit/delete to hide.
  // Fill in your own hosting story (VPS, Raspberry Pi, old laptop, cloud, etc.).
  homelab: {
    headline: "Where this site lives",
    intro: "One line on your hosting setup and why it's interesting.",
    specs: [
      { label: "Machine", value: "e.g. Raspberry Pi 5 / old laptop / $5 VPS" },
      { label: "OS", value: "e.g. Ubuntu 22.04 LTS" },
      { label: "Network", value: "ISP → DNS/tunnel → CDN → yourdomain.com" },
      { label: "Workloads", value: "Docker / Kubernetes / bare nginx / etc." },
      { label: "Monitoring", value: "Grafana / Uptime Kuma / none" },
    ],
    notes: [
      "Any war stories — outages survived, hardware fixes, jank that somehow works.",
    ],
  },

  // Short descriptors shown as badges on your hero.
  tags: ["Software Engineer", "Open Source Contributor"],

  // Programming languages you work in — mapped to icons automatically.
  // Supported: Java, Python, TypeScript, Rust, JavaScript, Go, C++, C#, etc.
  languages: ["JavaScript", "TypeScript", "Python"],

  frameworks: {
    // Each entry: { name, id, desc, link }
    // id is used for icon lookup — see src/services/getTechIcon.ts for supported ids.
    frontend: [
      {
        name: "React",
        id: "react",
        desc: "UI Library",
        link: "https://reactjs.org/",
      },
      {
        name: "Tailwind CSS",
        id: "tailwindcss",
        desc: "Styling Library",
        link: "https://tailwindcss.com/",
      },
    ],
    backend: [
      {
        name: "Node.js",
        id: "nodejs",
        desc: "JavaScript Runtime",
        link: "https://nodejs.org/",
      },
      {
        name: "FastAPI",
        id: "fastapi",
        desc: "Python Web Framework",
        link: "https://fastapi.tiangolo.com/",
      },
    ],
    databases: [
      {
        name: "PostgreSQL",
        id: "postgresql",
        desc: "Relational Database",
        link: "https://www.postgresql.org/",
      },
    ],
    misc: [
      {
        name: "Docker",
        id: "docker",
        desc: "Containerization",
        link: "https://www.docker.com/",
      },
    ],
  },

  // Competitive programming handles.
  // Leave empty strings "" to hide the section gracefully.
  cp: {
    codeforces: "your_cf_handle",
    leetcode: "your_lc_handle",
  },

  // What you're actively building right now — shown with a live indicator.
  currentWork: {
    title: "Your Current Project",
    org: "Organization or Personal",
    orgUrl: "https://github.com/org/project",
    description:
      "A short description of what you're building and why it matters.",
    links: [
      {
        name: "Repository",
        link: "https://github.com/yourusername/project",
      },
    ],
    tags: ["Tech Stack", "Tools Used"],
    startDate: "Month Year",
  },

  // Blog posts — rendered inline with expand/collapse.
  // Set link to an external URL (e.g. dev.to post) or leave null for inline content.
  blogs: [
    {
      title: "Your First Blog Post Title",
      date: "Month Year",
      readTime: "5 min read",
      excerpt:
        "A one-sentence hook that gets someone to click read more.",
      tags: ["Tag1", "Tag2"],
      content: `The full content of your blog post goes here.

You can use line breaks for paragraphs. Markdown is not rendered — keep it as plain text.

This is a good place to share what you learned, what you built, or a story about your journey.`,
    },
    {
      title: "Another Post",
      date: "Month Year",
      readTime: "3 min read",
      excerpt: "Another compelling excerpt.",
      tags: ["Tag1"],
      content: `Content here.`,
    },
  ],

  projects: [
    {
      name: "Project Name",
      description:
        "What the project does and what problem it solves.",
      type: "github",
      links: [
        {
          name: "GitHub",
          link: "https://github.com/yourusername/project",
        },
        {
          name: "Live",
          link: "https://your-project.com",
        },
      ],
      skills: ["React", "Node.js", "PostgreSQL"],
    },
    {
      name: "Another Project",
      description: "Short description.",
      type: "github",
      links: [
        {
          name: "GitHub",
          link: "https://github.com/yourusername/another-project",
        },
      ],
      skills: ["Python", "FastAPI"],
    },
  ],

  // Social links — id maps to icon (github, linkedin, twitter, instagram, spotify, etc.)
  contacts: [
    {
      id: "github",
      name: "GitHub",
      site: "https://github.com/",
      link: "https://github.com/yourusername",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      site: "https://www.linkedin.com/",
      link: "https://linkedin.com/in/yourusername",
    },
    {
      id: "twitter",
      name: "X / Twitter",
      site: "https://x.com/",
      link: "https://x.com/yourusername",
    },
  ],

  // Work experience — internships / jobs. Shown as its own "Experience" section
  // on the homepage (between Journey and Projects). Leave [] to hide the section
  // entirely (e.g. if you haven't done any internships yet).
  experience: [
    {
      role: "Software Engineering Intern",
      company: "Company Name",
      companyUrl: "https://company.com",   // optional — links the company name
      date: "Jun 2024 – Aug 2024",
      location: "Remote",                  // optional
      description:
        "What you worked on and the impact you had, in one or two sentences. " +
        "Lead with outcomes (shipped X, cut Y by Z%) over responsibilities.",
      skills: ["TypeScript", "React", "AWS"],  // optional pills
    },
    {
      role: "Open Source Contributor",
      company: "Project / Org",
      date: "2024",
      description: "A shorter entry — location, url and skills are all optional.",
    },
  ],

  journey: [
    {
      title: "Your Role",
      company: "Company or University",
      date: "Year – Present",
      description:
        "What you did or are doing here.",
    },
    {
      title: "Previous Role",
      company: "Company",
      date: "Year – Year",
      description: "What you did here.",
    },
  ],

  // Shown below your name with a typing animation.
  desc_brief: "One sentence about who you are and what you do.",

  // Revealed when clicking Show More — can be longer.
  desc: "Hi, I'm [name]. A longer description of your background, interests, and what drives you.\nFeel free to use multiple lines.",
};
