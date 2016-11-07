const test = require("tape");
const memdb = require("memdb");
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
        t.assert(err == null, "Should not return error");

        db.get(newUser.username, function(err, value) {
            t.assert(value != null, "Should find new user");
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
        t.assert(err == null, "Should not return error");

        db.get(existingUser.username, function(err, user) {
            t.assert(user != null, "Should find overwritten user");
            t.equal(user.email, existingUser.email, "User email should have been updated");
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
        t.assert(err == null, "Should not return error");
        t.assert(user != null, "Should find user");
        t.equal(user.email, newUser.email, "User email should match");
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
        t.equals(err, -2, "Should return error, since user does not exist");
        t.assert(user == null, "Should not find user");
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
        t.assert(err == null, "Should not return error");

        db.get(user.username, function(err, user) {
            t.assert(err != null, "User should have been removed");
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
        t.equals(err, -2, "Should return error, since user does not exist");
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
        t.assert(err == null, "Should not return errors");
        t.equals(users.length, 3, "Should find three users");
        t.equal(users[0].email, user2.email, "User2 email should match");
        t.equal(users[1].email, user3.email, "User3 email should match");
        t.equal(users[2].email, user47.email, "User47 email should match");
        t.end();
    });
});