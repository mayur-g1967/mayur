export const QUIZ_STRUCTURE = {
    science: {
        name: "Science",
        icon: "🧪",
        description: "Physics, Chemistry, Biology, Mathematics",
        gradient: "from-blue-500 to-purple-600",
        categories: {
            physics: {
                name: "Physics",
                icon: "⚛️",
                description: "Study of matter, energy and motion",
                subCategories: {
                    mechanics: {
                        name: "Mechanics",
                        topics: {
                            "laws-of-motion": { name: "Laws of Motion" },
                            "work-energy-power": { name: "Work, Energy & Power" },
                            "momentum-collisions": { name: "Momentum & Collisions" },
                            "circular-motion": { name: "Circular Motion" },
                            "rotational-mechanics": { name: "Rotational Mechanics" },
                            "gravitation": { name: "Gravitation" },
                            "oscillations": { name: "Oscillations" },
                        },
                    },
                    thermodynamics: {
                        name: "Thermodynamics",
                        topics: {
                            "temp-heat": { name: "Temperature & Heat" },
                            "laws-thermo": { name: "Laws of Thermodynamics" },
                            "heat-engines": { name: "Heat Engines" },
                            "entropy": { name: "Entropy" },
                            "thermal-properties": { name: "Thermal Properties of Matter" },
                            "kinetic-theory": { name: "Kinetic Theory of Gases" },
                        },
                    },
                },
            },
            chemistry: {
                name: "Chemistry",
                icon: "🧬",
                description: "Study of chemical reactions and matter",
                subCategories: {
                    "organic-chemistry": {
                        name: "Organic Chemistry",
                        topics: {
                            hydrocarbons: { name: "Hydrocarbons" },
                            "alcohols-phenols": { name: "Alcohols & Phenols" },
                            "aldehydes-ketones": { name: "Aldehydes & Ketones" },
                            "carboxylic-acids": { name: "Carboxylic Acids" },
                            polymers: { name: "Polymers" },
                            biomolecules: { name: "Biomolecules" },
                            "reaction-mechanisms": { name: "Reaction Mechanisms" },
                            stereochemistry: { name: "Stereochemistry" },
                        },
                    },
                    "inorganic-chemistry": {
                        name: "Inorganic Chemistry",
                        topics: {
                            "periodic-trends": { name: "Periodic Table Trends" },
                            "chemical-bonding": { name: "Chemical Bonding" },
                            "coordination-compounds": { name: "Coordination Compounds" },
                            "transition-elements": { name: "Transition Elements" },
                            metallurgy: { name: "Metallurgy" },
                            "block-elements": { name: "s, p, d & f Block Elements" },
                        },
                    },
                    "physical-chemistry": {
                        name: "Physical Chemistry",
                        topics: {
                            "atomic-structure": { name: "Atomic Structure" },
                            "chemical-kinetics": { name: "Chemical Kinetics" },
                            thermochemistry: { name: "Thermochemistry" },
                            electrochemistry: { name: "Electrochemistry" },
                            solutions: { name: "Solutions" },
                            "surface-chemistry": { name: "Surface Chemistry" },
                        },
                    },
                },
            },
        },
    },
    programming: {
        name: "Programming & CS",
        icon: "💻",
        description: "Fundamentals, Web Dev, OOP, and more",
        gradient: "from-green-500 to-teal-600",
        categories: {
            fundamentals: {
                name: "Programming Fundamentals",
                icon: "⌨️",
                description: "Core coding concepts and logic",
                subCategories: {
                    "core-concepts": {
                        name: "Core Concepts",
                        topics: {
                            "variables-datatypes": { name: "Variables & Data Types" },
                            operators: { name: "Operators" },
                            conditionals: { name: "Conditional Statements" },
                            loops: { name: "Loops" },
                            functions: { name: "Functions" },
                            scope: { name: "Scope" },
                            debugging: { name: "Debugging" },
                        },
                    },
                    oop: {
                        name: "Object-Oriented Programming",
                        topics: {
                            "classes-objects": { name: "Classes & Objects" },
                            inheritance: { name: "Inheritance" },
                            polymorphism: { name: "Polymorphism" },
                            encapsulation: { name: "Encapsulation" },
                            abstraction: { name: "Abstraction" },
                            interfaces: { name: "Interfaces" },
                            "exception-handling": { name: "Exception Handling" },
                        },
                    },
                },
            },
            "web-dev": {
                name: "Web Development",
                icon: "🌐",
                description: "Frontend and Backend systems",
                subCategories: {
                    frontend: {
                        name: "Frontend Development",
                        topics: {
                            "html-basics": { name: "HTML Basics" },
                            "css-styling": { name: "CSS Styling" },
                            "responsive-design": { name: "Responsive Design" },
                            "js-basics": { name: "JavaScript Basics" },
                            "dom-manipulation": { name: "DOM Manipulation" },
                            "browser-events": { name: "Browser Events" },
                            accessibility: { name: "Accessibility" },
                        },
                    },
                    backend: {
                        name: "Backend Development",
                        topics: {
                            "server-basics": { name: "Server Basics" },
                            "rest-apis": { name: "REST APIs" },
                            authentication: { name: "Authentication" },
                            databases: { name: "Databases" },
                            middleware: { name: "Middleware" },
                            "error-handling": { name: "Error Handling" },
                        },
                    },
                },
            },
        },
    },
    mathematics: {
        name: "Mathematics",
        icon: "📐",
        description: "Algebra, Calculus, Geometry",
        gradient: "from-purple-500 to-pink-600",
        categories: {
            algebra: {
                name: "Algebra",
                icon: "🔢",
                description: "Equations, Matrices, Polynomials",
                subCategories: {
                    "core-algebra": {
                        name: "Core Algebra",
                        topics: {
                            "linear-equations": { name: "Linear Equations" },
                            "quadratic-equations": { name: "Quadratic Equations" },
                            polynomials: { name: "Polynomials" },
                            inequalities: { name: "Inequalities" },
                            functions: { name: "Functions" },
                            matrices: { name: "Matrices" },
                            determinants: { name: "Determinants" },
                            "complex-numbers": { name: "Complex Numbers" },
                        },
                    },
                },
            },
            calculus: {
                name: "Calculus",
                icon: "📈",
                description: "Differentiation, Integration, Limits",
                subCategories: {
                    "diff-int": {
                        name: "Differentiation & Integration",
                        topics: {
                            limits: { name: "Limits" },
                            continuity: { name: "Continuity" },
                            differentiation: { name: "Differentiation" },
                            "app-derivatives": { name: "Applications of Derivatives" },
                            integration: { name: "Integration" },
                            "def-integrals": { name: "Definite Integrals" },
                            "diff-equations": { name: "Differential Equations" },
                        },
                    },
                },
            },
        },
    },
    history: {
        name: "History",
        icon: "📜",
        description: "Ancient, Medieval, and Modern World History",
        gradient: "from-amber-600 to-orange-700",
        categories: {
            periods: {
                name: "Historical Periods",
                icon: "🏛️",
                description: "Explore different eras of human history",
                subCategories: {
                    ancient: {
                        name: "Ancient Civilizations",
                        topics: {
                            "indus-valley": { name: "Indus Valley Civilization" },
                            "egyptian-civ": { name: "Ancient Egypt" },
                            "mesopotamia": { name: "Mesopotamia" },
                            "greek-roman": { name: "Greek & Roman Empire" },
                        },
                    },
                    medieval: {
                        name: "Medieval Period",
                        topics: {
                            "crusades": { name: "The Crusades" },
                            "feudalism": { name: "Feudalism in Europe" },
                            "silk-road": { name: "The Silk Road" },
                            "mughal-empire": { name: "The Mughal Empire" },
                        },
                    },
                    modern: {
                        name: "Modern History",
                        topics: {
                            "renaissance": { name: "The Renaissance" },
                            "industrial-rev": { name: "Industrial Revolution" },
                            "world-war-1": { name: "World War I" },
                            "world-war-2": { name: "World War II" },
                            "cold-war": { name: "The Cold War" },
                        },
                    },
                    "indian-history": {
                        name: "Indian History",
                        topics: {
                            "ch.shivaji-maharaj": { name: "Chhatrapati Shivaji Maharaj history" },
                            "maharana-pratap": { name: "maharana pratap history" },
                            "indus-valley": { name: "Indus Valley Civilization" },
                            "mauryan-empire": { name: "Mauryan Empire" },
                            "gupta-empire": { name: "Gupta Empire" },
                            "mughal-empire": { name: "Mughal Empire" },
                            "colonial-era": { name: "Colonial Era" },
                            "vedic-period": { name: "Vedic Period" },
                        },
                    },
                },
            },
        },
    },
    humanities: {
        name: "Humanities",
        icon: "📚",
        description: "History, Geography, Literature",
        gradient: "from-orange-500 to-amber-600",
        categories: {
            history: {
                name: "History",
                icon: "🏛️",
                description: "Ancient to Modern History",
                subCategories: {
                    periods: {
                        name: "Historical Periods",
                        topics: {
                            "ancient-civilizations": { name: "Ancient Civilizations" },
                            medieval: { name: "Medieval Period" },
                            modern: { name: "Modern History" },
                            "freedom-struggle": { name: "Indian Freedom Struggle" },
                            "world-wars": { name: "World Wars" },
                            revolutions: { name: "Revolutions" },
                            "cultural-history": { name: "Cultural History" },
                        },
                    },
                },
            },
            geography: {
                name: "Geography",
                icon: "🌍",
                description: "Earth, Climate, Resources",
                subCategories: {
                    "earth-systems": {
                        name: "Earth Systems",
                        topics: {
                            "earth-structure": { name: "Earth Structure" },
                            landforms: { name: "Landforms" },
                            climate: { name: "Climate Systems" },
                            resources: { name: "Natural Resources" },
                            population: { name: "Population Studies" },
                            environmental: { name: "Environmental Geography" },
                        },
                    },
                },
            },
        },
    },
    business: {
        name: "Business & Management",
        icon: "💼",
        description: "Principles, Marketing, Sales",
        gradient: "from-emerald-500 to-cyan-slow",
        categories: {
            management: {
                name: "Management",
                icon: "📈",
                description: "Leadership, Planning, Organizing",
                subCategories: {
                    principles: {
                        name: "Management Principles",
                        topics: {
                            "m-principles": { name: "Principles of Management" },
                            planning: { name: "Planning" },
                            organizing: { name: "Organizing" },
                            staffing: { name: "Staffing" },
                            leadership: { name: "Leadership" },
                            motivation: { name: "Motivation" },
                            controlling: { name: "Controlling" },
                        },
                    },
                },
            },
            marketing: {
                name: "Marketing",
                icon: "📣",
                description: "Market Research, Digital Marketing",
                subCategories: {
                    concepts: {
                        name: "Marketing Concepts",
                        topics: {
                            "market-concepts": { name: "Marketing Concepts" },
                            "market-research": { name: "Market Research" },
                            "consumer-behavior": { name: "Consumer Behavior" },
                            "digital-marketing": { name: "Digital Marketing" },
                            branding: { name: "Branding" },
                            advertising: { name: "Advertising" },
                            sales: { name: "Sales Management" },
                        },
                    },
                },
            },
        },
    },
    "personal-dev": {
        name: "Personal Development",
        icon: "👤",
        description: "Communication, EQ, Soft Skills",
        gradient: "from-rose-500 to-pink-600",
        categories: {
            communication: {
                name: "Communication Skills",
                icon: "🗣️",
                description: "Verbal, Non-verbal, Public Speaking",
                subCategories: {
                    skills: {
                        name: "Core Skills",
                        topics: {
                            "verbal-comm": { name: "Verbal Communication" },
                            "non-verbal": { name: "Non-Verbal Communication" },
                            "public-speaking": { name: "Public Speaking" },
                            presentation: { name: "Presentation Skills" },
                            listening: { name: "Active Listening" },
                            assertiveness: { name: "Assertiveness" },
                            "body-language": { name: "Body Language" },
                        },
                    },
                },
            },
            eq: {
                name: "Emotional Intelligence",
                icon: "🧠",
                description: "Self-awareness, Empathy, Social Skills",
                subCategories: {
                    concepts: {
                        name: "EQ Concepts",
                        topics: {
                            "self-awareness": { name: "Self-Awareness" },
                            "self-control": { name: "Self-Control" },
                            motivation: { name: "Motivation" },
                            empathy: { name: "Empathy" },
                            "social-skills": { name: "Social Skills" },
                            "stress-management": { name: "Stress Management" },
                        },
                    },
                },
            },
        },
    },
    psychology: {
        name: "Psychology",
        icon: "🧘",
        description: "Cognitive, Social, Behavior",
        gradient: "from-yellow-500 to-orange-600",
        categories: {
            cognitive: {
                name: "Cognitive Psychology",
                icon: "🧠",
                description: "Memory, Learning, Perception",
                subCategories: {
                    "core-concepts": {
                        name: "Core Concepts",
                        topics: {
                            memory: { name: "Memory" },
                            learning: { name: "Learning" },
                            perception: { name: "Perception" },
                            intelligence: { name: "Intelligence" },
                            thinking: { name: "Thinking" },
                            "problem-solving": { name: "Problem Solving" },
                            "decision-making": { name: "Decision Making" },
                        },
                    },
                },
            },
            social: {
                name: "Social Psychology",
                icon: "👥",
                description: "Attitudes, Group Behavior",
                subCategories: {
                    "core-concepts": {
                        name: "Core Concepts",
                        topics: {
                            attitudes: { name: "Attitudes" },
                            influence: { name: "Social Influence" },
                            groups: { name: "Group Behavior" },
                            leadership: { name: "Leadership" },
                            relations: { name: "Interpersonal Relations" },
                            prejudice: { name: "Prejudice" },
                        },
                    },
                },
            },
        },
    },
    technology: {
        name: "Tech Trends",
        icon: "🚀",
        description: "AI, Cyber Security, Blockchain",
        gradient: "from-indigo-500 to-blue-600",
        categories: {
            ai: {
                name: "Artificial Intelligence",
                icon: "🤖",
                description: "ML, Neural Networks, NLP",
                subCategories: {
                    "ai-ml": {
                        name: "AI & ML",
                        topics: {
                            "ai-basics": { name: "AI Basics" },
                            "machine-learning": { name: "Machine Learning" },
                            supervised: { name: "Supervised Learning" },
                            unsupervised: { name: "Unsupervised Learning" },
                            "neural-networks": { name: "Neural Networks" },
                            nlp: { name: "Natural Language Processing" },
                            "computer-vision": { name: "Computer Vision" },
                            "ai-ethics": { name: "AI Ethics" },
                        },
                    },
                },
            },
            cybersecurity: {
                name: "Cyber Security",
                icon: "🛡️",
                description: "Protection and Defense",
                subCategories: {
                    basics: {
                        name: "Security Basics",
                        topics: {
                            attacks: { name: "Types of Cyber Attacks" },
                            malware: { name: "Malware" },
                            cryptography: { name: "Cryptography Basics" },
                            network: { name: "Network Security" },
                            web: { name: "Web Security" },
                            "ethical-hacking": { name: "Ethical Hacking" },
                            laws: { name: "Cyber Laws" },
                        },
                    },
                },
            },
        },
    },
    arts: {
        name: "Arts & Creativity",
        icon: "🎨",
        description: "Writing, Visual Arts, Design",
        gradient: "from-pink-500 to-rose-600",
        categories: {
            writing: {
                name: "Creative Writing",
                icon: "✍️",
                description: "Story, Plot, Poetry",
                subCategories: {
                    skills: {
                        name: "Writing Skills",
                        topics: {
                            structure: { name: "Story Structure" },
                            characters: { name: "Character Development" },
                            plot: { name: "Plot Building" },
                            dialogue: { name: "Dialogue Writing" },
                            poetry: { name: "Poetry" },
                            screenwriting: { name: "Screenwriting" },
                            editing: { name: "Editing & Proofreading" },
                        },
                    },
                },
            },
            visual: {
                name: "Visual Arts",
                icon: "🖼️",
                description: "Drawing, Color Theory, Design",
                subCategories: {
                    basics: {
                        name: "Art Basics",
                        topics: {
                            drawing: { name: "Drawing Basics" },
                            "color-theory": { name: "Color Theory" },
                            composition: { name: "Composition" },
                            perspective: { name: "Perspective" },
                            digital: { name: "Digital Art" },
                            graphic: { name: "Graphic Design" },
                        },
                    },
                },
            },
        },
    },
    games: {
        name: "Games & Sports",
        icon: "🎮",
        description: "Indoor, Outdoor, E-sports",
        gradient: "from-violet-500 to-indigo-600",
        categories: {
            indoor: {
                name: "Indoor Games",
                icon: "🏠",
                description: "Chess, Carrom, Board games",
                subCategories: {
                    mental: {
                        name: "Mental Sports",
                        topics: {
                            chess: { name: "Chess" },
                            carrom: { name: "Carrom" },
                            sudoku: { name: "Sudoku" },
                            crossword: { name: "Crossword" },
                        },
                    },
                },
            },
            outdoor: {
                name: "Outdoor Games",
                icon: "⚽",
                description: "Cricket, Football, Athletics",
                subCategories: {
                    ball: {
                        name: "Ball Games",
                        topics: {
                            cricket: { name: "Cricket" },
                            football: { name: "Football" },
                            basketball: { name: "Basketball" },
                            tennis: { name: "Tennis" },
                        },
                    },
                },
            },
        },
    },
};
