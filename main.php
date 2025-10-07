<?php
session_start();

// Database connection settings
$host = 'localhost';
$db   = 'your_database';
$user = 'your_db_user';
$pass = 'your_db_password';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password.';
    } else {
        try {
            $pdo = new PDO($dsn, $user, $pass, $options);
            $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                header('Location: dashboard.php');
                exit;
            } else {
                $error = 'Invalid username or password.';
            }
        } catch (PDOException $e) {
            $error = 'Database error: ' . htmlspecialchars($e->getMessage());
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login - Secure Portal</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            background: linear-gradient(120deg, #2980b9, #8e44ad);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: #fff;
            padding: 2.5rem 2rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(44, 62, 80, 0.2);
            width: 100%;
            max-width: 400px;
        }
        .login-container h2 {
            margin-bottom: 1.5rem;
            color: #34495e;
            text-align: center;
        }
        .form-group {
            margin-bottom: 1.2rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #555;
        }
        .form-group input {
            width: 100%;
            padding: 0.7rem;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        .form-group input:focus {
            border-color: #8e44ad;
            outline: none;
        }
        .login-btn {
            width: 100%;
            padding: 0.8rem;
            background: linear-gradient(90deg, #2980b9, #8e44ad);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
        }
        .login-btn:hover {
            background: linear-gradient(90deg, #8e44ad, #2980b9);
        }
        .error-message {
            color: #e74c3c;
            background: #fdecea;
            border: 1px solid #e74c3c;
            padding: 0.7rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            text-align: center;
        }
        .extra-links {
            margin-top: 1.2rem;
            text-align: center;
        }
        .extra-links a {
            color: #2980b9;
            text-decoration: none;
            margin: 0 0.5rem;
            font-size: 0.97rem;
        }
        .extra-links a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
<div class="login-container">
    <h2>Login to Your Account</h2>
    <?php if ($error): ?>
        <div class="error-message"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <form method="post" autocomplete="off" novalidate>
        <div class="form-group">
            <label for="username">Username or Email</label>
            <input type="text" id="username" name="username" required maxlength="50" autofocus value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required maxlength="100">
        </div>
        <button type="submit" class="login-btn">Login</button>
    </form>
    <div class="extra-links">
        <a href="forgot_password.php">Forgot Password?</a> |
        <a href="register.php">Create Account</a>
    </div>
</div>
</body>
</html>