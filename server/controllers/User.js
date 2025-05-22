import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js"
import User from "../models/User.js";
import Workout from "../models/Workout.js";

dotenv.config();

export const UserRegister = async (req, res, next) => {
    try {
        const { name, email, password, img } = req.body;
        const existedUser = await User.findOne({ email }).exec();
        if (!existedUser) {
            return next(createError(409, "Email is already in use"));
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const user = new User({
            name, 
            email, 
            password: hashedPassword,
            img,
        });
        const createdUser = await user.save();
        const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET,
             { expiresIn: "9999 years" });
             return res.status(200).json({ token, user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to register user" });
    }
};

export const UserLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).exec();
        if  (!existedUser) {
            return next(createError(409, "Email is already in use"));
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const user = new User({
            name, 
            email, 
            password: hashedPassword,
            img,
        });
        const createdUser = await user.save();
        const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET,
             { expiresIn: "9999 years" });
             return res.status(200).json({ token, user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to register user" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(403).json({ message: "Invalid password" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET,
             { expiresIn: "9999 years" });
             return res.status(200).json({ token, user });
    } catch (error) {
        next(error);
    }
};

const getUserDashboard = async (req, res, next) => {
    const { id } = req.params;
    try {
        const userId = req.user?.id;
        const user = await User.findById(userId);
        if (!user) {
            return next(createError(404, "User not found"));
        }
        const currentDateFormatted = new Date();
        const startToday = new Date(
            currentDateFormatted.getFullYear(),
            currentDateFormatted.getMonth(),
            currentDateFormatted.getDate()
        );
        const endToday = new Date(
            currentDateFormatted.getFullYear(),
            currentDateFormatted.getMonth(),
            currentDateFormatted.getDate() + 1
        );

        //calculate total calories burnt
        const totalCaloriesBurnt = await Workout.aggregate([
            {
                $match: {
                    user: userId,
                    date: {
                        $gte: startToday,
                        $lt: endToday,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalCaloriesBurnt: {
                        $sum: "$caloriesBurned",
                    },
                },
            },
        ]);
        //Calculate total no of workouts
        const totalWorkouts = await Workout.countDocuments({ 
            user: userId,
            date: {
                $gte: startToday,
                $lt: endToday,
            },
        });
        //calculate average calories burnt per workout
        const avgCaloriesBurntPerWorkout = totalCaloriesBurnt.length > 0 ? totalCaloriesBurnt[0].totalCaloriesBurnt / totalWorkouts : 0;
        
        //Fetch category of workouts
        const categoryCalories = await Workout.aggregate([
            {
                $match: {
                    user: user._id,
                    date: {
                        $gte: startToday,
                        $lt: endToday,
                    },
                },
            },
            {
                $group: {
                    _id: "$category",
                    totalCaloriesBurnt: {$sum: "$caloriesBurned"},
                },
            },
        ]);
        
        const pieChartData = categoryCalories.map((category, index) => ({
            id: index,
            value: category.totalCaloriesBurnt,
            label: category._id,
        }));

        const weeks = [];
        const caloriesBurnt = [];
        for (let i = 6; i>=0; i--) {
            const date = new Date(
                currentDateFormatted.getTime() - i * 24 * 60 * 60 * 1000
            );
            weeks.push(`date.getDate()}th`);
            const startofDay = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            const endOfDay = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + 1
            );
            const weekData = await Workout.aggregate([
                {
                    $match: {
                        user: userId,
                        date: {
                            $gte: startOfWeek,
                            $lt: endOfWeek,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalCaloriesBurnt: {
                            $sum: "$caloriesBurned",
                        },
                    },
                },
            ]);
            caloriesBurnt.push(weekData[0]?.totalCaloriesBurnt);
         
        }
        return res.status(200).json({
            totalCaloriesBurnt: totalCaloriesBurnt[0].totalCaloriesBurnt : 0,
            totalWorkouts: totalWorkouts,
            totalWeeksCaloriesBurnt: {weeks: weeks,
                caloriesBurned: caloriesBurned
            },
            pieChartData: pieChartData,
           });
    } catch (error) {
        next(error);
    }   
};

export const getWorkoutsByDate = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const user = await User.findById(userId);
        console.log(req.query.date);
        let date = req.query.date ? new Date(req.query.date) : new Date();
        console.log(date);
        if (!user) {
            return next(createError(404, "User not found"));
        }
        const startOfDay = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
        const endOfDay = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1
        );

        const todaysWorkouts = await Workout.find({
            userId: userId,
            date: {
                $gte: startOfDay,
                $lt: endOfDay, 
            },
        });
        const totalCaloriesBurnt = todaysWorkouts.reduce((total, workout) => total + workout.caloriesBurned, 0);
        
    } catch (error) {
        next(error);
    }
}