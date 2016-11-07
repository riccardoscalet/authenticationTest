const test = require("tape");
const memdb = require("memdb");
import * as hash from "object-hash";
import { User, UsersService } from "../services/users.service";

let memdbOptions = {
    keyEncoding: "json",
    valueEncoding: "json"
};


test("UsersService.add - With new user - Should not return error and insert new user", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);

    // Act
    let newUser = new User("User1", "Pass1", "user@user.com", ["admin"]);
    sut.add(newUser, function(err) {
        //Assert
        t.equal(err, undefined, "Should not return error");

        db.get(newUser.username, function(err, value) {
            t.notEqual(value, undefined, "Should find added user");
            newUser.password = hash.sha1(newUser.password);
            t.deepEqual(value, newUser, "User retrieved should match, including hashed password");
            t.end();
        });
    })
});

test("UsersService.add - With existing user - Should not return error and overwrite user", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);
    let newUser = new User("User1", "Pass1", "user@user.com", ["admin"]);
    sut.add(newUser, function(err) {});

    // Act
    let existingUser = new User("User1", "asdasd", "asdasd@user.com", ["admin", "normal"]);
    sut.add(existingUser, function(err) {
        //Assert
        t.equal(err, undefined, "Should not return error");

        db.get(existingUser.username, function(err, user) {
            t.notEqual(user, undefined, "Should find overwritten user");
            existingUser.password = hash.sha1(existingUser.password);
            t.deepEqual(user, existingUser, "User retrieved should match the one overwritten, including hashed password");
            t.end();
        });
    })
});

test("UsersService.get - With existing user - Should return user", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);
    let newUser = new User("User1", "Pass1", "user@user.com", ["admin"]);
    sut.add(newUser, function(err) {});

    // Act
    sut.get(newUser.username, function(err, user) {
        //Assert
        t.equal(err, undefined, "Should not return error");
        t.notEqual(user, undefined, "Should find added user");
        newUser.password = hash.sha1(newUser.password);
        t.deepEqual(user, newUser, "User retrieved should match, including hashed password");
        t.end();
    });
});

test("UsersService.get - With wrong user - Should return error", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);
    let user = new User("User1", "Pass1", "user@user.com", ["admin"]);

    // Act
    sut.get(user.username, function(err, user) {
        //Assert
        t.equal(err, -2, "Should return error, since user does not exist");
        t.equal(user, undefined, "Should not find user");
        t.end();
    });
});

test("UsersService.remove - With existing user - Should remove user", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);
    let user = new User("User1", "Pass1", "user@user.com", ["admin"]);
    sut.add(user, function(err) {});

    // Act
    sut.remove(user.username, function(err) {
        //Assert
        t.equal(err, undefined, "Should not return error");

        sut.get(user.username, function(err, user) {
            t.equal(err, -2, "Should not find user, since it has been removed");
        });
        t.end();
    })
});

test("UsersService.remove - With wrong user - Should return error", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);
    let user = new User("User1", "Pass1", "user@user.com", ["admin"]);

    // Act
    sut.remove(user.username, function(err) {
        //Assert
        t.equal(err, -2, "Should return error, since user does not exist");
        t.end();
    })
});

test("UsersService.getAll - Should return all users", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);
    let user47 = new User("User47", "Pass1", "user1@user.com", ["admin"]);
    let user2 = new User("User2", "Pass2", "user2@user.com", ["normal"]);
    let user3 = new User("User3SpecialFlavor", "Pass3", "user3@user.com", ["banana and truffle"]);
    sut.add(user47, function(err) {});
    sut.add(user2, function(err) {});
    sut.add(user3, function(err) {});

    // Act
    sut.getAll(function(err, users) {
        //Assert
        t.equal(err, undefined, "Should not return errors");
        t.equal(users.length, 3, "Should find three users");
        user2.password = hash.sha1(user2.password);
        user3.password = hash.sha1(user3.password);
        user47.password = hash.sha1(user47.password);
        t.deepEqual(users[0], user2, "User2 should match");
        t.deepEqual(users[1], user3, "User3 should match");
        t.deepEqual(users[2], user47, "User47 should match");
        t.end();
    });
});

test("UsersService.validateCredentials - With existing user and good password - Should return true and user", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);

    let newUser = new User("User1", "Pass1", "user@user.com", ["admin"]);
    sut.add(newUser, function(err) {});

    // Act
    sut.validateCredentials(newUser.username, newUser.password, function(err, isValid, user) {
        //Assert
        t.equal(err, undefined, "Should not return error");
        t.equal(isValid, true, "Validation should succeed");
        newUser.password = hash.sha1(newUser.password);
        t.deepEqual(user, newUser, "User retrieved should match, including hashed password")
        t.end();
    })
});

test("UsersService.validateCredentials - With existing user but bad password - Should return false", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);

    let newUser = new User("User1", "Pass1", "user@user.com", ["admin"]);
    let wrongPassword = "NukeBanana";
    sut.add(newUser, function(err) {});

    // Act
    sut.validateCredentials(newUser.username, wrongPassword, function(err, isValid, user) {
        //Assert
        t.equal(err, -3, "Should return incorrect password error");
        t.equal(isValid, false, "Validation should fail");
        t.equal(user, undefined, "User should not be returned");
        t.end();
    })
});

test("UsersService.validateCredentials - With non-existing user - Should return false", function(t) {
    //Arrange
    let db = memdb(memdbOptions);
    let sut = new UsersService(db);

    let newUser = new User("User1", "Pass1", "user@user.com", ["admin"]);
    let wrongUser = "JuicyTruffle";
    sut.add(newUser, function(err) {});

    // Act
    sut.validateCredentials(wrongUser, "ThisDoesntReallyMatter", function(err, isValid, user) {
        //Assert
        t.equal(err, -2, "Should return non-existing user error");
        t.equal(isValid, false, "Validation should fail");
        t.equal(user, undefined, "User should not be returned");
        t.end();
    })
});