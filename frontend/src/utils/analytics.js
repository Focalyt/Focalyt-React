import ReactGA from "react-ga4";

export const initGA = () => {
    ReactGA.initialize("G-07MS9294D8"); // Apna Measurement ID yahan dalen
};

export const logPageView = () => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};
