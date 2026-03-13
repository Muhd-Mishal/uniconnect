CREATE DATABASE IF NOT EXISTS uniconnect;
USE uniconnect;

CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expiry BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profile (
  profile_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  department VARCHAR(50),
  year INT,
  skills TEXT,
  career_interest VARCHAR(100),
  profile_pic VARCHAR(255),
  resume VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
  post_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  like_id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  comment_id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS career_resources (
  resource_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  link VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT DEFAULT NULL,
  group_id INT DEFAULT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interview_questions (
  question_id INT PRIMARY KEY AUTO_INCREMENT,
  domain VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  ideal_answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_results (
  result_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  user_answer TEXT NOT NULL,
  score FLOAT NOT NULL,
  feedback TEXT NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES interview_questions(question_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answer_evaluations (
  evaluation_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question_id INT DEFAULT NULL,
  answer TEXT NOT NULL,
  similarity_score DECIMAL(6,4) NOT NULL,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES interview_questions(question_id) ON DELETE SET NULL
);

-- Insert an admin user: password is 'admin123' hashed with bcrypt
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@uniconnect.com', '$2a$10$wV2h3X5.Qj.a5B0PjS.vG.T8lWzB693r1g6d8Hk1Xy4Z5t9sO7P.q', 'admin');

-- Insert Sample Interview Questions
INSERT INTO interview_questions (domain, question, ideal_answer) VALUES
('Java', 'What is OOP? Explain its core concepts.', 'Object-Oriented Programming (OOP) is a programming paradigm based on the concept of objects. Its core concepts include Encapsulation (hiding data and methods within an object), Inheritance (creating new classes from existing ones), Polymorphism (ability of an object to take on many forms), and Abstraction (hiding complex details and showing only essential features).'),
('DBMS', 'Explain normalization in databases.', 'Normalization is the process of organizing data in a database. This includes creating tables and establishing relationships between those tables according to rules designed both to protect the data and to make the database more flexible by eliminating redundancy and inconsistent dependency.'),
('HR', 'Where do you see yourself in 5 years?', 'In 5 years, I see myself as a senior developer or technical lead, having taken on greater responsibilities and contributed to significant, impact-driven projects. I hope to have deepened my expertise in software engineering and mentored junior developers while continuing to learn new technologies.');
