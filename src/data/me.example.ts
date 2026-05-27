// Copy this file to me.ts and fill in your details.
// cp src/data/me.example.ts src/data/me.ts

export default {
  // Your full name — used in title, footer, navbar logo, and Ollama chat.
  name: "Your Name",

  // Direct URL to your profile photo.
  image: "https://your-image-url.com/photo.jpg",

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
