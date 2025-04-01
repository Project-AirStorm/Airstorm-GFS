import React from 'react';
import './About.css';

// Team member profile images
import antonioImg from '../../assets/profiles/antonio.jpeg';
import connorImg from '../../assets/profiles/connor.jpeg';
import duaaImg from '../../assets/profiles/duaa.jpeg';
import elianaImg from '../../assets/profiles/eliana.jpeg';
import joshuaImg from '../../assets/profiles/joshua.jpeg';
import vincentImg from '../../assets/profiles/vincent.jpeg';

// Icons
import { Github, Linkedin, ExternalLink } from 'lucide-react';

const About = () => {
  const teamMembers = [
    // Team Lead first
    {
      name: 'Joshua Francis',
      role: 'Team Lead / Frontend & Backend Developer',
      image: joshuaImg,
      linkedin: 'https://www.linkedin.com/in/joshuamiddletonfrancis/',
      github: 'https://github.com/joshmfrancis/'
    },
    // Frontend devs
    {
      name: 'Duaa Khawaldeh',
      role: 'Frontend Developer',
      image: duaaImg,
      linkedin: 'https://www.linkedin.com/in/duaakhawaldeh/',
      github: 'https://github.com/duaamusa'
    },
    {
      name: 'Antonio Mata',
      role: 'Frontend Developer / Lead Designer',
      image: antonioImg,
      linkedin: 'https://www.linkedin.com/in/antoniosmata/',
      github: 'https://github.com/antoniosmata'
    },
    {
      name: 'Eliana Gafford',
      role: 'Frontend Developer',
      image: elianaImg,
      linkedin: 'https://www.linkedin.com/in/elianagafford/',
      github: 'https://github.com/ElianaGafford'
    },
    // Backend devs
    {
      name: 'Connor Zittrauer',
      role: 'Backend & Frontend Developer',
      image: connorImg,
      linkedin: 'https://www.linkedin.com/in/connor-zittrauer/',
      github: 'https://github.com/connorzittrauer'
    },
    {
      name: 'Vincent Hartline',
      role: 'Frontend & Backend Developer',
      image: vincentImg,
      linkedin: 'https://www.linkedin.com/in/vincenthartline/',
      github: 'https://github.com/Vinny424'
    },
  ];

  const techStack = [
    {
      category: 'Frontend',
      technologies: [
        { name: 'React.js', link: 'https://reactjs.org/' },
        { name: 'Tailwind CSS', link: 'https://tailwindcss.com/' },
      ],
    },
    {
      category: 'Backend',
      technologies: [
        { name: 'Python', link: 'https://www.python.org/' },
        { name: 'Flask', link: 'https://flask.palletsprojects.com/' },
        { name: 'MySQL', link: 'https://www.mysql.com/' },
        { name: 'Docker', link: 'https://www.docker.com/' },
      ],
    },
    {
      category: 'Services & APIs',
      technologies: [
        { name: 'OpenMeteo Weather API', link: 'https://open-meteo.com/' },
        { name: 'MeteoSource', link: 'https://www.meteosource.com/' },
        {
          name: 'NWS Alerts',
          link: 'https://www.weather.gov/documentation/services-web-api',
        },
        { name: 'Google Gemini AI', link: 'https://ai.google.dev/' },
        { name: 'Google Maps API', link: 'https://developers.google.com/maps' },
        {
          name: 'Google Reverse Geolocation API',
          link: 'https://developers.google.com/maps/documentation/geocoding',
        },
      ],
    },
    {
      category: 'Infrastructure',
      technologies: [
        { name: 'AWS Cloud Services', link: 'https://aws.amazon.com/' },
        {
          name: 'GitHub Actions (CI/CD)',
          link: 'https://github.com/features/actions',
        },
        { name: 'Clerk Authentication', link: 'https://clerk.com/' },
        { name: 'Stream Chat', link: 'https://getstream.io/chat/' },
      ],
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <section className="about-section project-info">
          <h1>About Heimdall</h1>
          <p className="subtitle">
            AI-Powered Weather Forecasting for AFGSC Aviation
          </p>

          <div className="project-description">
            <p>
              Project Airstorm's Heimdall is an advanced weather visualization
              tool integrating GraphCast AI to enhance aviation operations for
              Air Force Global Strike Command (AFGSC). By leveraging AI-driven
              forecasting, we deliver real-time, high-accuracy weather
              predictions critical for mission planning and safety.
            </p>

            <div className="key-objectives">
              <h3>Key Objectives</h3>
              <ul>
                <li>
                  30% accuracy improvement in medium-range weather forecasts
                </li>
                <li>20% reduction in mission planning time</li>
                <li>80%+ user adoption rate within AFGSC</li>
                <li>
                  Establish AFGSC as a leader in AI-driven weather forecasting
                </li>
              </ul>
            </div>

            <div className="key-features">
              <h3>Key Features</h3>
              <ul>
                <li>Real-time GraphCast AI weather predictions</li>
                <li>Enhanced aviation safety with AI-driven insights</li>
                <li>
                  Extreme weather alerts for mission-critical decision-making
                </li>
                <li>
                  User-friendly visualization dashboard for AFGSC operations
                </li>
                <li>Seamless integration with existing military systems</li>
              </ul>
            </div>
          </div>

          <div className="external-links">
            <a
              href="https://linktr.ee/projectairstorm"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              <ExternalLink size={16} />
              <span>Project Linktree</span>
            </a>
            <a
              href="https://github.com/Project-AirStorm"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              <Github size={16} />
              <span>GitHub Organization</span>
            </a>
          </div>
        </section>

        <section className="about-section tech-stack">
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            {techStack.map((category, index) => (
              <div key={index} className="tech-category">
                <h3>{category.category}</h3>
                <ul>
                  {category.technologies.map((tech, techIndex) => (
                    <li key={techIndex}>
                      <a
                        href={tech.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tech-link"
                      >
                        {tech.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section team-section">
          <h2>Meet The Team</h2>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member-card">
                <div className="member-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <div className="member-links">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="linkedin-link"
                    >
                      <Linkedin size={16} />
                      <span>LinkedIn</span>
                    </a>
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-link"
                    >
                      <Github size={16} />
                      <span>GitHub</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section acknowledgments">
          <h2>Acknowledgments</h2>
          <p>
            This project is a strategic leap toward cutting-edge military
            weather intelligence, ensuring AFGSC stays ahead in operational
            readiness and technological superiority. Developed with passion and
            innovation by the Louisiana State University Shreveport computer
            science team in collaboration with the Air Force Global Strike
            Command.
          </p>
          <p className="copyright">
            © {new Date().getFullYear()} Project Airstorm - All Rights Reserved
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
