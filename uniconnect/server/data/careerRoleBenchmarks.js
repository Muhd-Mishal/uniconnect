export const CAREER_ROLE_BENCHMARKS = [
    {
        job_title: 'Frontend Developer',
        essential_skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Responsive Design', 'REST APIs', 'Git'],
        ats_keywords: ['react', 'javascript', 'frontend', 'ui', 'responsive', 'api integration', 'tailwind', 'git'],
    },
    {
        job_title: 'Backend Developer',
        essential_skills: ['Node.js', 'Express', 'SQL', 'REST APIs', 'Authentication', 'Database Design', 'Git'],
        ats_keywords: ['node.js', 'express', 'backend', 'mysql', 'api', 'jwt', 'database', 'server'],
    },
    {
        job_title: 'Full Stack Developer',
        essential_skills: ['JavaScript', 'React', 'Node.js', 'Express', 'SQL', 'REST APIs', 'Git'],
        ats_keywords: ['full stack', 'react', 'node.js', 'express', 'mysql', 'api', 'frontend', 'backend'],
    },
    {
        job_title: 'UI UX Designer',
        essential_skills: ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'Visual Design', 'Accessibility'],
        ats_keywords: ['ui', 'ux', 'figma', 'prototype', 'wireframe', 'user research', 'design system', 'accessibility'],
    },
    {
        job_title: 'Data Analyst',
        essential_skills: ['SQL', 'Excel', 'Data Visualization', 'Python', 'Statistics', 'Dashboarding'],
        ats_keywords: ['data analysis', 'sql', 'excel', 'python', 'dashboard', 'power bi', 'tableau', 'analytics'],
    },
    {
        job_title: 'Machine Learning Engineer',
        essential_skills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Model Evaluation', 'Data Processing'],
        ats_keywords: ['machine learning', 'python', 'pandas', 'numpy', 'tensorflow', 'scikit-learn', 'model', 'data preprocessing'],
    },
    {
        job_title: 'DevOps Engineer',
        essential_skills: ['Linux', 'CI CD', 'Docker', 'Cloud Deployment', 'Monitoring', 'Git'],
        ats_keywords: ['devops', 'docker', 'ci/cd', 'aws', 'deployment', 'linux', 'automation', 'monitoring'],
    },
    {
        job_title: 'Product Manager',
        essential_skills: ['Product Strategy', 'Roadmapping', 'Stakeholder Communication', 'User Research', 'Analytics'],
        ats_keywords: ['product', 'roadmap', 'stakeholders', 'user needs', 'analytics', 'prioritization', 'strategy'],
    },
];

export const findBenchmarksForRoles = (targetRoles = []) => {
    const normalizedTargets = targetRoles.map((role) => role.toLowerCase());

    return CAREER_ROLE_BENCHMARKS.filter((benchmark) =>
        normalizedTargets.includes(benchmark.job_title.toLowerCase())
    );
};
