import {
  FaReact,
  FaAngular,
  FaVuejs,
  FaHtml5,
  FaCss3,
  FaPython,
  FaNodeJs,
  FaJava,
  FaRust,
  FaLaravel,
  FaJsSquare,
  FaGitAlt,
  FaQuestion,
  FaSwift,
  FaDocker,
  FaLinux,
} from "react-icons/fa";
import {
  SiC,
  SiCplusplus,
  SiGo,
  SiPostgresql,
  SiSqlite,
  SiTailwindcss,
  SiSpringboot,
  SiTypescript,
  SiNextdotjs,
  SiFlask,
  SiFastapi,
  SiDjango,
  SiChakraui,
  SiMongodb,
  SiMysql,
  SiExpress,
  SiRedux,
  SiBootstrap,
  SiGraphql,
  SiVite,
  SiWebpack,
  SiKubernetes,
  SiRedis,
  SiDotnet,
  SiBabel,
  SiPhp,
  SiRubyonrails,
} from "react-icons/si";
import { IconType } from "react-icons";

export const getTechIcon = (id: string): { icon: IconType; label: string } => {
  switch (id.toLowerCase()) {
    // Core Languages
    case "c":
    case "csharp":
    case "c#":
      return { icon: SiC, label: "C" };
    case "c++":
    case "cpp":
    case "cplusplus":
      return { icon: SiCplusplus, label: "C++" };
    case "go":
      return { icon: SiGo, label: "Go" };
    case "rust":
      return { icon: FaRust, label: "Rust" };
    case "java":
      return { icon: FaJava, label: "Java" };
    case "swift":
      return { icon: FaSwift, label: "Swift" };
    case "typescript":
      return { icon: SiTypescript, label: "TypeScript" };
    case "javascript":
      return { icon: FaJsSquare, label: "JavaScript" };
    case "python":
      return { icon: FaPython, label: "Python" };
    case "php":
      return { icon: SiPhp, label: "PHP" };

    // Web
    case "html":
    case "html5":
      return { icon: FaHtml5, label: "HTML" };
    case "css":
    case "css3":
      return { icon: FaCss3, label: "CSS" };
    case "tailwind":
    case "tailwindcss":
      return { icon: SiTailwindcss, label: "Tailwind CSS" };
    case "bootstrap":
      return { icon: SiBootstrap, label: "Bootstrap" };

    // Frontend Frameworks
    case "react":
    case "reactjs":
      return { icon: FaReact, label: "React" };
    case "redux":
      return { icon: SiRedux, label: "Redux" };
    case "next":
    case "nextjs":
      return { icon: SiNextdotjs, label: "Next.js" };
    case "angular":
      return { icon: FaAngular, label: "Angular" };
    case "vue":
    case "vuejs":
      return { icon: FaVuejs, label: "Vue.js" };
    case "chakra":
    case "chakraui":
      return { icon: SiChakraui, label: "Chakra UI" };

    // Backend Frameworks
    case "node":
    case "nodejs":
      return { icon: FaNodeJs, label: "Node.js" };
    case "express":
      return { icon: SiExpress, label: "Express" };
    case "laravel":
      return { icon: FaLaravel, label: "Laravel" };
    case "flask":
      return { icon: SiFlask, label: "Flask" };
    case "quart":
      return { icon: SiFlask, label: "Quart" };
    case "fastapi":
      return { icon: SiFastapi, label: "FastAPI" };
    case "django":
      return { icon: SiDjango, label: "Django" };
    case "spring":
    case "springboot":
      return { icon: SiSpringboot, label: "Spring Boot" };
    case "dotnet":
      return { icon: SiDotnet, label: ".NET" };
    case "rails":
    case "rubyonrails":
      return { icon: SiRubyonrails, label: "Ruby on Rails" };

    // Databases
    case "mysql":
      return { icon: SiMysql, label: "MySQL" };
    case "postgres":
    case "postgresql":
      return { icon: SiPostgresql, label: "PostgreSQL" };
    case "sqlite":
      return { icon: SiSqlite, label: "SQLite" };
    case "mongodb":
      return { icon: SiMongodb, label: "MongoDB" };
    case "redis":
      return { icon: SiRedis, label: "Redis" };

    // DevOps & Tools
    case "docker":
      return { icon: FaDocker, label: "Docker" };
    case "kubernetes":
      return { icon: SiKubernetes, label: "Kubernetes" };
    case "git":
      return { icon: FaGitAlt, label: "Git" };
    case "vite":
      return { icon: SiVite, label: "Vite" };
    case "webpack":
      return { icon: SiWebpack, label: "Webpack" };
    case "babel":
      return { icon: SiBabel, label: "Babel" };

    // Misc
    case "graphql":
      return { icon: SiGraphql, label: "GraphQL" };
    case "linux":
      return { icon: FaLinux, label: "Linux" };

    default:
      return { icon: FaQuestion, label: id };
  }
};
