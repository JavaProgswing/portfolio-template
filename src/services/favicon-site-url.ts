import { IconType } from "react-icons";
import {
  FaGithub,
  FaLinkedin,
  FaStackOverflow,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaReddit,
  FaDiscord,
  FaGlobe,
  FaTwitch,
  FaMedium,
  FaGitlab,
  FaDev,
  FaDribbble,
  FaBehance,
  FaPinterest,
  FaQuestion,
} from "react-icons/fa";

const getSiteIconUrl = (site: string): IconType => {
  switch (site.toLowerCase()) {
    case "github":
      return FaGithub;
    case "gitlab":
      return FaGitlab;
    case "linkedin":
      return FaLinkedin;
    case "stackoverflow":
      return FaStackOverflow;
    case "twitter":
      return FaTwitter;
    case "youtube":
      return FaYoutube;
    case "facebook":
      return FaFacebook;
    case "instagram":
      return FaInstagram;
    case "reddit":
      return FaReddit;
    case "discord":
      return FaDiscord;
    case "website":
    case "portfolio":
    case "blog":
    case "site":
      return FaGlobe;
    case "twitch":
      return FaTwitch;
    case "medium":
      return FaMedium;
    case "dev":
    case "dev.to":
      return FaDev;
    case "dribbble":
      return FaDribbble;
    case "behance":
      return FaBehance;
    case "pinterest":
      return FaPinterest;
    default:
      return FaQuestion;
  }
};

/*
Convert site links to favicon URLs by http://www.google.com/s2/favicons?domain=
*/
const getFaviconUrl = (site: string): string => {
  return `http://www.google.com/s2/favicons?sz=32&domain=${site}`;
};

export { getFaviconUrl, getSiteIconUrl };
