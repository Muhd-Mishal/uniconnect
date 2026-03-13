# Database Schema

## `career_resources`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| resource_id | int(11) | NO | PRI | NULL | auto_increment |
| title | varchar(100) | NO |  | NULL |  |
| description | text | NO |  | NULL |  |
| link | varchar(255) | NO |  | NULL |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

## `chat_groups`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| name | varchar(100) | NO |  | NULL |  |
| created_by | int(11) | NO | MUL | NULL |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

## `comments`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| comment_id | int(11) | NO | PRI | NULL | auto_increment |
| post_id | int(11) | NO | MUL | NULL |  |
| user_id | int(11) | NO | MUL | NULL |  |
| comment | text | NO |  | NULL |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

## `group_members`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| group_id | int(11) | NO | PRI | NULL |  |
| user_id | int(11) | NO | PRI | NULL |  |
| joined_at | timestamp | NO |  | current_timestamp() |  |
| is_admin | tinyint(1) | NO |  | 0 |  |

## `interview_questions`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| question_id | int(11) | NO | PRI | NULL | auto_increment |
| domain | varchar(50) | NO |  | NULL |  |
| question | text | NO |  | NULL |  |
| ideal_answer | text | NO |  | NULL |  |

## `interview_results`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| result_id | int(11) | NO | PRI | NULL | auto_increment |
| user_id | int(11) | NO | MUL | NULL |  |
| question_id | int(11) | NO | MUL | NULL |  |
| user_answer | text | NO |  | NULL |  |
| score | float | NO |  | NULL |  |
| feedback | text | NO |  | NULL |  |
| attempted_at | timestamp | NO |  | current_timestamp() |  |

## `likes`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| like_id | int(11) | NO | PRI | NULL | auto_increment |
| post_id | int(11) | NO | MUL | NULL |  |
| user_id | int(11) | NO | MUL | NULL |  |

## `messages`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| sender_id | int(11) | NO | MUL | NULL |  |
| receiver_id | int(11) | YES | MUL | NULL |  |
| content | text | NO |  | NULL |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| group_id | int(11) | YES |  | NULL |  |

## `notifications`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| id | int(11) | NO | PRI | NULL | auto_increment |
| user_id | int(11) | NO | MUL | NULL |  |
| source_user_id | int(11) | NO | MUL | NULL |  |
| type | enum('like','comment') | NO |  | NULL |  |
| reference_id | int(11) | NO |  | NULL |  |
| message | text | NO |  | NULL |  |
| is_read | tinyint(1) | YES |  | 0 |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

## `posts`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| post_id | int(11) | NO | PRI | NULL | auto_increment |
| user_id | int(11) | NO | MUL | NULL |  |
| content | text | NO |  | NULL |  |
| image | varchar(255) | YES |  | NULL |  |
| created_at | timestamp | NO |  | current_timestamp() |  |

## `student_profile`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| profile_id | int(11) | NO | PRI | NULL | auto_increment |
| user_id | int(11) | NO | MUL | NULL |  |
| department | varchar(50) | YES |  | NULL |  |
| year | int(11) | YES |  | NULL |  |
| skills | text | YES |  | NULL |  |
| career_interest | varchar(100) | YES |  | NULL |  |
| profile_pic | varchar(255) | YES |  | NULL |  |
| resume | varchar(255) | YES |  | NULL |  |

## `users`

| Field | Type | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| user_id | int(11) | NO | PRI | NULL | auto_increment |
| username | varchar(50) | NO |  | NULL |  |
| email | varchar(100) | NO | UNI | NULL |  |
| password | varchar(255) | NO |  | NULL |  |
| role | enum('student','admin') | NO |  | student |  |
| created_at | timestamp | NO |  | current_timestamp() |  |
| is_verified | tinyint(1) | YES |  | 0 |  |
| otp_code | varchar(6) | YES |  | NULL |  |
| otp_expiry | datetime | YES |  | NULL |  |
| verification_token | varchar(255) | YES |  | NULL |  |
| reset_token | varchar(255) | YES |  | NULL |  |
| reset_token_expiry | bigint(20) | YES |  | NULL |  |

