export default {
  name: "Yashasvi Allen Kujur",
  image: "https://yashasviallen.is-a.dev/me.jpg?v=5",
  tags: ["CSE Core Student", "Software Developer", "Tech Enthusiast"],
  languages: ["Java", "Python", "JavaScript", "TypeScript", "Rust", "C++"],
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
      {
        name: "Chakra UI",
        id: "chakraui",
        desc: "Styling Library",
        link: "https://chakra-ui.com/",
      },
      {
        name: "JavaFX",
        id: "javafx",
        desc: "Client Application Platform",
        link: "https://openjfx.io/",
      },
    ],
    backend: [
      {
        name: "Flask",
        id: "flask",
        desc: "Python Web Framework",
        link: "https://flask.palletsprojects.com/en/latest/",
      },
      {
        name: "Quart",
        id: "quart",
        desc: "Python Web Framework",
        link: "https://quart.palletsprojects.com/en/latest/",
      },
      {
        name: "FastAPI",
        id: "fastapi",
        desc: "Python Web Framework",
        link: "https://fastapi.tiangolo.com/",
      },
      {
        name: "Spring Boot",
        id: "springboot",
        desc: "Java Web Framework",
        link: "https://spring.io/projects/spring-boot",
      },
    ],
    databases: [
      {
        name: "PostgreSQL",
        id: "postgresql",
        desc: "Relational Database",
        link: "https://www.postgresql.org/",
      },
      {
        name: "SQLite",
        id: "sqlite",
        desc: "Lightweight Database",
        link: "https://www.sqlite.org/index.html",
      },
    ],
    misc: [
      {
        name: "Selenium",
        id: "selenium",
        desc: "Web Browser Automation",
        link: "https://www.selenium.dev/",
      },
      {
        name: "Pystray",
        id: "python",
        desc: "System Tray Icons",
        link: "https://pypi.org/project/pystray/",
      },
    ],
  },
  projects: [
    {
      name: "SRM Wi-FI Autologin",
      description:
        "A tkinter/windows tray(pystray)-based Python application which automatically logins to the SRM wifi portal(Hostel/TP) when login expires, automatically detecting UB/Hostel wifi.",
      type: "github",
      links: [
        {
          name: "GitHub",
          link: "https://github.com/JavaProgswing/SRM-WIFI-Login",
        },
      ],
      skills: ["Python", "Tkinter", "Pystray", "Selenium"],
    },
    {
      name: "Valnarrator",
      description:
        "Designed a JavaFX application to narrate valorant text chat comms to ingame mic in agent/AWS/windows based voices. Made with typescript for tcp xmpp server, JavaFX for windows application.",
      type: "github",
      links: [
        {
          name: "GitHub",
          link: "https://github.com/JavaProgswing/valorantnarratorOPS",
        },
      ],
      skills: ["Java", "JavaFX", "TypeScript", "AWS Polly"],
    },
    {
      name: "Google Form Answer Bot",
      description:
        "Created a chrome based JS extension which automatically fills answers to google form based questions using GPT.",
      type: "github",
      links: [
        {
          name: "GitHub",
          link: "https://github.com/JavaProgswing/GoogleFormsAnswerBot",
        },
      ],
      skills: ["JavaScript", "Chrome Extension", "GPT"],
    },
    {
      name: "Aestron Discord Bot",
      description:
        "A multi-featured bot with moderation, music, logging, and giveaways.",
      type: "github",
      links: [
        { name: "GitHub", link: "https://github.com/JavaProgswing/aestron" },
      ],
      skills: ["Python", "Discord API"],
    },
    {
      name: "Stock Market Predictor",
      description:
        "Predicts stock market trends using Stock, News data and ChatGPT.",
      type: "github",
      links: [
        {
          name: "GitHub",
          link: "https://github.com/JavaProgswing/StockMarketPredictor",
        },
      ],
      skills: ["Python", "Selenium", "Quart"],
    },
  ],
  contacts: [
    {
      id: "github",
      name: "Github",
      site: "https://github.com/",
      link: "https://github.com/JavaProgswing/",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      site: "https://www.linkedin.com/",
      link: "https://yashasviallen.is-a.dev/linkedin",
    },
    {
      id: "instagram",
      name: "Instagram",
      site: "https://www.instagram.com/",
      link: "https://yashasviallen.is-a.dev/instagram",
    },
    {
      id: "spotify",
      name: "Spotify",
      site: "https://open.spotify.com/",
      link: "http://yashasviallen.is-a.dev/spotify",
    },
  ],
  journey: [
    {
      title: "Computer Science Engineering Student",
      company: "SRM Institute of Science and Technology",
      date: "2023 - Present",
      description:
        "Specializing in CSE Core. Building a strong foundation in software development, algorithms, and system design.",
    },
    {
      title: "Backend Developer",
      company: "Personal Projects",
      date: "2022 - Present",
      description:
        "Developed various automation tools and bots using Python, Java, and modern web frameworks.",
    },
  ],
  desc_brief:
    "I am a dedicated Computer Science Engineering student specializing in CSE Core at SRM Institute of Science and Technology.",
  desc: "I am a passionate tech enthusiast with a strong foundation in software development. Java is my daily driver, and I am curious about making projects that automate/ease daily tasks or make our lives more fun.",
};
