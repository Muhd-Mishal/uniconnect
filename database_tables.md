# UniConnect Database Tables Reference

This document provides a detailed technical breakdown of the database schema for the UniConnect platform.

---

### 1. `users`
Core table for user accounts and authentication.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `user_id` | int(11) | NO | PRI | NULL | auto_increment |
| `username` | varchar(50) | NO | | NULL | |
| `email` | varchar(100) | NO | UNI | NULL | |
| `password` | varchar(255) | NO | | NULL | |
| `role` | enum('student','admin') | NO | | 'student' | |
| `created_at` | timestamp | NO | | current_timestamp() | |
| `is_verified` | tinyint(1) | YES | | 0 | |
| `otp_code` | varchar(6) | YES | | NULL | |
| `otp_expiry` | datetime | YES | | NULL | |

---

### 2. `student_profile`
Extended profiles for students.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `profile_id` | int(11) | NO | PRI | NULL | auto_increment |
| `user_id` | int(11) | NO | MUL | NULL | |
| `department` | varchar(50) | YES | | NULL | |
| `year` | int(11) | YES | | NULL | |
| `skills` | text | YES | | NULL | |
| `career_interest` | varchar(100) | YES | | NULL | |
| `profile_pic` | varchar(255) | YES | | NULL | |
| `resume` | varchar(255) | YES | | NULL | |

---

### 3. `posts`
User-generated feed posts.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `post_id` | int(11) | NO | PRI | NULL | auto_increment |
| `user_id` | int(11) | NO | MUL | NULL | |
| `content` | text | NO | | NULL | |
| `image` | varchar(255) | YES | | NULL | |
| `created_at` | timestamp | NO | | current_timestamp() | |

---

### 4. `comments`
Comments on feed posts.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `comment_id` | int(11) | NO | PRI | NULL | auto_increment |
| `post_id` | int(11) | NO | MUL | NULL | |
| `user_id` | int(11) | NO | MUL | NULL | |
| `comment` | text | NO | | NULL | |
| `created_at` | timestamp | NO | | current_timestamp() | |

---

### 5. `likes`
User likes on posts.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `like_id` | int(11) | NO | PRI | NULL | auto_increment |
| `post_id` | int(11) | NO | MUL | NULL | |
| `user_id` | int(11) | NO | MUL | NULL | |

---

### 6. `messages`
One-to-one and group messages.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | int(11) | NO | PRI | NULL | auto_increment |
| `sender_id` | int(11) | NO | MUL | NULL | |
| `receiver_id` | int(11) | YES | MUL | NULL | |
| `group_id` | int(11) | YES | | NULL | |
| `content` | text | NO | | NULL | |
| `created_at` | timestamp | NO | | current_timestamp() | |

---

### 7. `chat_groups`
Groups for community discussions.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | int(11) | NO | PRI | NULL | auto_increment |
| `name` | varchar(100) | NO | | NULL | |
| `created_by` | int(11) | NO | MUL | NULL | |
| `created_at` | timestamp | NO | | current_timestamp() | |

---

### 8. `group_members`
Mapping of users to chat groups.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `group_id` | int(11) | NO | PRI | NULL | |
| `user_id` | int(11) | NO | PRI | NULL | |
| `joined_at` | timestamp | NO | | current_timestamp() | |
| `is_admin` | tinyint(1) | NO | | 0 | |

---

### 9. `interview_questions`
Question bank for AI-driven preparation.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `question_id` | int(11) | NO | PRI | NULL | auto_increment |
| `domain` | varchar(50) | NO | | NULL | |
| `question` | text | NO | | NULL | |
| `ideal_answer` | text | NO | | NULL | |

---

### 10. `interview_results`
Scores and feedback for user interviews.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `result_id` | int(11) | NO | PRI | NULL | auto_increment |
| `user_id` | int(11) | NO | MUL | NULL | |
| `question_id` | int(11) | NO | MUL | NULL | |
| `user_answer` | text | NO | | NULL | |
| `score` | float | NO | | NULL | |
| `feedback` | text | NO | | NULL | |
| `attempted_at` | timestamp | NO | | current_timestamp() | |

---

### 11. `notifications`
System and social alerts.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | int(11) | NO | PRI | NULL | auto_increment |
| `user_id` | int(11) | NO | MUL | NULL | |
| `source_user_id` | int(11) | NO | MUL | NULL | |
| `type` | enum('like','comment') | NO | | NULL | |
| `reference_id` | int(11) | NO | | NULL | |
| `message` | text | NO | | NULL | |
| `is_read` | tinyint(1) | YES | | 0 | |
| `created_at` | timestamp | NO | | current_timestamp() | |

---

### 12. `career_resources`
Links and descriptions for career growth.
| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `resource_id` | int(11) | NO | PRI | NULL | auto_increment |
| `title` | varchar(100) | NO | | NULL | |
| `description` | text | NO | | NULL | |
| `link` | varchar(255) | NO | | NULL | |
| `created_at` | timestamp | NO | | current_timestamp() | |
