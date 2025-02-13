-- Retrieves all locations associatied with every user
SELECT L.*, U.username
FROM Locations L
JOIN Users U ON L.user_id = U.user_id;
