export default {
  name: "John Doe",
  image: "https://via.placeholder.com/150",
  tags: ["Full Stack Developer", "Tech Enthusiast"],
  languages: ["JavaScript", "TypeScript", "Python", "Java"],
  frameworks: {
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
        name: "Express",
        id: "express",
        desc: "Web Framework",
        link: "https://expressjs.com/",
      },
    ],
    databases: [
      {
        name: "MongoDB",
        id: "mongodb",
        desc: "NoSQL Database",
        link: "https://www.mongodb.com/",
      },
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
  projects: [
    {
      name: "Awesome Project",
      description:
        "A brief description of your awesome project and what it does.",
      type: "github",
      links: [
        {
          name: "GitHub",
          link: "https://github.com/yourusername/awesome-project",
        },
        {
          name: "Live Demo",
          link: "https://awesome-project.com",
        },
      ],
      skills: ["React", "Node.js", "MongoDB"],
    },
    {
      name: "Another Cool App",
      description:
        "Description of another cool application you built.",
      type: "website",
      links: [
        {
          name: "Website",
          link: "https://cool-app.com",
        },
      ],
      skills: ["Vue.js", "Firebase"],
    },
  ],
  contacts: [
    {
      id: "github",
      name: "Github",
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
      name: "Twitter",
      site: "https://twitter.com/",
      link: "https://twitter.com/yourusername",
    },
    {
      id: "email",
      name: "Email",
      site: "mailto:",
      link: "mailto:your.email@example.com",
    },
  ],
  journey: [
    {
      title: "Senior Developer",
      company: "Tech Corp",
      date: "2023 - Present",
      description:
        "Leading the frontend team and building scalable web applications.",
    },
    {
      title: "Junior Developer",
      company: "Startup Inc",
      date: "2021 - 2023",
      description:
        "Developed full-stack features and maintained legacy codebases.",
    },
  ],
  desc_brief:
    "I am a software engineer passionate about building web applications and solving complex problems.",
  desc: "Hi, I'm a passionate developer who loves to code and build things. I have experience with various technologies and enjoy learning new things every day.\n I am always looking for new challenges and opportunities to grow.",
};
