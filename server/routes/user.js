const router = require("express").Router();
let User = require("../schemas/user");

router.route("/").get(async function (req, res) {
  User.find({}).then((users) => res.json(users));
});

router.route("/match/:id").get(async function (req, res) {
  try {
    const users = await User.find({});
    const userDictionary = {};

    const genderMap = {
      male: 1,
      female: 2,
      "prefer not to say": 3,
      other: 4,
    };

    const departmentMap = {
      "College of Agriculture and Life Sciences": 1,
      "College of Architecture": 2,
      "Mays Business School": 3,
      "College of Education and Human Development": 4,
      "College of Engineering": 5,
      "College of Geosciences": 6,
      "College of Liberal Arts": 7,
      "College of Science": 8,
      "School of Public Health": 9,
      "College of Veterinary Medicine and Biomedical Sciences": 10,
    };

    const sleepTimeMap = {
      "Before 8pm": 1,
      "Between 8 to 10pm": 2,
      "Between 10 to 12pm": 3,
      "After midnight": 4,
    };

    users.forEach((user) => {
      const attributes = [
        user.gender ? genderMap[user.gender.toLowerCase()] : null,
        user.age,
        user.department ? departmentMap[user.department] : null,
        user.roomTemp,
        user.selfCleanliness,
        user.selfGuests,
        user.selfLoudness,
        user.roommateInteraction,
        user.selfSleepTime ? sleepTimeMap[user.selfSleepTime] : null,
        user.roommateMajor ? departmentMap[user.department] : null,
        user.roommateGuests,
        user.roommateLoudness,
      ];

      if (attributes.every((attr) => attr != null)) {
        userDictionary[user._id] = attributes;
      }
    });
    if (!Object.keys(userDictionary).includes(req.params.id)) {
      res.status(400).json({ message: "No matching id" });
      return;
    }

    const dataConverted = Object.values(userDictionary).map((row) =>
      row.map((item) => Number(item))
    );
    const dataKeys = Object.keys(userDictionary);

    const mins = Array(dataConverted[0].length).fill(Infinity);
    const maxs = Array(dataConverted[0].length).fill(-Infinity);
    dataConverted.forEach((row) => {
      row.forEach((value, index) => {
        mins[index] = Math.min(mins[index], value);
        maxs[index] = Math.max(maxs[index], value);
      });
    });
    // Step 3: Normalize each value using Min-Max normalization
    const normalizedData = dataConverted.map((row) =>
      row.map((value, index) => {
        const min = mins[index];
        const max = maxs[index];
        return max - min === 0 ? 0 : (value - min) / (max - min); // Prevent division by zero
      })
    );
    const normalizedDict = {};
    dataKeys.forEach((key, index) => {
      normalizedDict[key] = normalizedData[index];
    });
    const modifiedDict = {};

    for (const [key, row] of Object.entries(normalizedDict)) {
      modifiedDict[key] = [...row]; // Create a shallow copy of the row
      modifiedDict[key][0] *= 10;
      modifiedDict[key][1] *= 8;
      modifiedDict[key][2] *= 3;
      modifiedDict[key][3] *= 6;
      modifiedDict[key][4] *= 9;
      modifiedDict[key][5] *= 8;
      modifiedDict[key][6] *= 9;
      modifiedDict[key][7] *= 7;
      modifiedDict[key][8] *= 10;
      modifiedDict[key][9] *= 3;
      modifiedDict[key][10] *= 8;
      modifiedDict[key][11] *= 9;
    }
    const selected = modifiedDict[req.params.id];
    delete modifiedDict[req.params.id];
    const calculateMSE = (arr1, arr2) => {
      let sum = 0;
      for (let i = 0; i < arr1.length; i++) {
        sum += Math.pow(arr1[i] - arr2[i], 2);
      }
      return sum / arr1.length;
    };
    // Convert dictionary into an array of key-value pairs for sorting
    // Convert dictionary into an array of key-value pairs for sorting
    const sortedEntries = Object.entries(modifiedDict)
      .map(([key, value]) => {
        // Retrieve original attributes from userDictionary
        const originalAttributes = users.find((user) => user._id == key) || [];
        return {
          key,
          mse: calculateMSE(value, selected),
          ...originalAttributes._doc, // Add original attributes here
        };
      })
      .sort((a, b) => a.mse - b.mse);
    console.log(modifiedDict);
    // Output sorted result
    console.log("Sorted entries by MSE:");
    sortedEntries.forEach((entry) => {
      console.log(
        `ID: ${entry.key}, MSE: ${entry.mse}, Attributes: ${entry.originalAttributes}`
      );
    });

    res.json(sortedEntries);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.route("/test").get(async function (req, res) {
  res.json({ msg: "hello" });
});

router.route("/dropUsers").get(async (req, res) => {
  try {
    // Drop the entire Users collection
    await User.collection.drop();
    res.status(200).json("Users collection dropped successfully.");
  } catch (err) {
    // Catch the error if the collection doesn't exist or another issue occurs
    if (err.code === 26) {
      res.status(400).json("Collection does not exist.");
    } else {
      res.status(500).json("Error dropping the collection: " + err);
    }
  }
});

router.route("/add").post(async function (req, res) {
  // Check if the user already exists based on the email
  const exists = await User.findOne({ email: req.body.email });
  if (exists) {
    res.json("User already exists");
    return;
  }

  const newUser = new User({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
  });

  newUser
    .save()
    .then((user) => res.json({ id: user.id }))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").get((req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        return res.status(404).json("User not found");
      }
      res.json(user);
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:username").delete((req, res) => {
  User.findOneAndDelete({ username: req.params.username })
    .then(() => res.json("User deleted."))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/update/:id").post(async (req, res) => {
  try {
    console.log(req.body);
    // Find the user by ID
    const user = await User.findById(req.params.id);
    console.log(req.params.id);
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Replace the user information with new values or retain the old values if not provided
    User.replaceOne(
      { _id: req.params.id }, // Find the user by ID
      {
        fullName: req.body.fullName || user.fullName,
        gender: req.body.gender || user.gender,
        age: req.body.age || user.age,
        phoneNumber: req.body.phoneNumber || user.phoneNumber,
        homeTown: req.body.homeTown || user.homeTown,
        state: req.body.state || user.state,
        department: req.body.department || user.department,
        roomTemp: req.body.roomTemp || user.roomTemp,
        selfCleanliness: req.body.selfCleanliness || user.selfCleanliness,
        selfGuests: req.body.selfGuests || user.selfGuests,
        selfLoudness: req.body.selfLoudness || user.selfLoudness,
        roommateInteraction:
          req.body.roommateInteraction || user.roommateInteraction,
        selfSleepTime: req.body.selfSleepTime || user.selfSleepTime,
        selfMajor: req.body.selfMajor || user.selfMajor,
        pictureName: req.body.pictureName || user.pictureName,
        roommateMajor: req.body.roommateMajor || user.roommateMajor,
        roommateGuests: req.body.roommateGuests || user.roommateGuests,
        roommateLoudness: req.body.roommateLoudness || user.roommateLoudness,
        bio: req.body.bio || user.bio,
        email: req.body.email || user.email, // Update email if provided
        password: req.body.password || user.password, // Use updated or existing password
      }
    )
      .then(() => res.status(200).json("User updated!"))
      .catch((err) => res.status(400).json("Error: " + err));
  } catch (err) {
    res.status(500).json("Error: " + err);
  }
});

router.route("/login").post(async function (req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(400).json("incorrect credentials");
    return;
  }
  if (user.password != req.body.password) {
    res.status(400).json("incorrect credentials");
  } else {
    const userDB = await User.findOne({ email: req.body.email });
    res.status(200).json({
      message: "login success",
      id: userDB._id,
    });
  }
});

module.exports = router;
