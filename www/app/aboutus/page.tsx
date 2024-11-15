import { Github, Linkedin } from "lucide-react";

export default function About() {
  const teamMembers = [
    {
      name: "Dhariya Shah",
      role: "Project Lead",
      info: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Incidunt impedit quam quas atque voluptatem consequuntur beatae laboriosam ducimus ipsa.",
      image:
        "https://res-console.cloudinary.com/dmccunmzi/media_explorer_thumbnails/5f4fe03670644558412633098e40b042/detailed",
      github: "https://github.com/dhairyathedev",
      linkedin: "https://www.linkedin.com/in/dhairyashah24",
    },
    {
      name: "Priyanshu Valiya",
      role: "Developer",
      info: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Incidunt impedit quam quas atque voluptatem consequuntur beatae laboriosam ducimus ipsa.",
      image:
        "https://res-console.cloudinary.com/dmccunmzi/media_explorer_thumbnails/62d1a357a3b1d699b2ef8288deb4825d/detailed",
      github: "https://github.com/PriyanshuValiya",
      linkedin: "https://www.linkedin.com/in/priyanshu-valiya19012006",
    },
    {
      name: "Ashok Suthar",
      role: "Designer",
      info: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Incidunt impedit quam quas atque voluptatem consequuntur beatae laboriosam ducimus ipsa.",
      image:
        "https://res-console.cloudinary.com/dmccunmzi/media_explorer_thumbnails/817c14e03b92763cd3e5f6bf6e62037a/detailed",
      github: "https://github.com/Ashok089",
      linkedin: "https://www.linkedin.com/in/ashok-suthar-ba9699284",
    }
  ];

  return (
    <div className="max-w-screen-xl m-auto mt-6">
      <div className="headline text-center rounded-lg">
        <h1 className="text-3xl font-bold mb-12">Meet Our Team</h1>
      </div>

      <div className="team-members-grid grid grid-cols-1 md:grid-cols-3 gap-8 mx-2">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="team-member mx-10 shadow-md rounded-lg p-6 flex flex-col md:flex-col hover:scale-105 transition-all duration-300 ease-in-out"
          >
            <div className="member-image-container w-full md:w-48 mr-4">
              <img
                src={member.image}
                alt={member.name}
                className="member-image mx-10 rounded-lg hover:transform hover:translate-y-[-20px] transition-all duration-300 ease-in-out"
              />
            </div>
            <div className="member-info-container mt-4 flex flex-col justify-between md:w-full pt-4 md:pt-0 pl-4 md:pl-0">
              <div>
                <h3 className="member-name text-xl font-bold text-gray-800">
                  {member.name}
                </h3>
                <p className="member-role text-gray-600">{member.role}</p>
                <p className="py-2 text-gray-600">{member.info}</p>
              </div>
              <div className="member-links flex justify-between mt-4">
                
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 mr-4 flex items-center"
                >
                  <Github />
                </a>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <Linkedin />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
