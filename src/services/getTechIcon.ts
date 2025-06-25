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
} from "react-icons/fa";
import {
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
} from "react-icons/si";
import { IconType } from "react-icons";

export const getTechIcon = (id: string): { icon: IconType; label: string } => {
  switch (id.toLowerCase()) {
    case "reactjs":
    case "react":
      return { icon: FaReact, label: "React" };
    case "angular":
      return { icon: FaAngular, label: "Angular" };
    case "vue":
    case "vuejs":
      return { icon: FaVuejs, label: "Vue" };
    case "html":
    case "html5":
      return { icon: FaHtml5, label: "HTML" };
    case "css":
    case "css3":
      return { icon: FaCss3, label: "CSS" };
    case "tailwind":
    case "tailwindcss":
      return { icon: SiTailwindcss, label: "Tailwind" };
    case "typescript":
      return { icon: SiTypescript, label: "TypeScript" };
    case "javascript":
      return { icon: FaJsSquare, label: "JavaScript" };
    case "python":
      return { icon: FaPython, label: "Python" };
    case "java":
      return { icon: FaJava, label: "Java" };
    case "spring":
    case "springboot":
      return { icon: SiSpringboot, label: "Spring Boot" };
    case "node":
    case "nodejs":
      return { icon: FaNodeJs, label: "Node.js" };
    case "next":
    case "nextjs":
      return { icon: SiNextdotjs, label: "Next.js" };
    case "laravel":
      return { icon: FaLaravel, label: "Laravel" };
    case "rust":
      return { icon: FaRust, label: "Rust" };
    case "flask":
      return { icon: SiFlask, label: "Flask" };
    case "quart":
      return { icon: SiFlask, label: "Quart" };
    case "fastapi":
      return { icon: SiFastapi, label: "FastAPI" };
    case "django":
      return { icon: SiDjango, label: "Django" };
    case "chakra":
    case "chakraui":
      return { icon: SiChakraui, label: "Chakra UI" };
    case "mongodb":
      return { icon: SiMongodb, label: "MongoDB" };
    case "mysql":
      return { icon: SiMysql, label: "MySQL" };
    case "express":
      return { icon: SiExpress, label: "Express" };
    case "git":
      return { icon: FaGitAlt, label: "Git" };
    default:
      return { icon: FaQuestion, label: id };
  }
};
