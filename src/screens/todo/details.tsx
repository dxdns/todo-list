import {
    Box,
    Checkbox,
    HStack,
    IconButton,
    Input,
    ScrollView,
    Text,
    VStack,
    useColorModeValue,
    useToast
} from "native-base";
import { TodoType } from "../../@types/todo";
import Icon from "react-native-vector-icons/Feather";
import { useEffect, useState } from "react";
import { getRealm } from "../../db/realm";
import uuid from "react-native-uuid";

export default function TodoDetails() {
    const [inputValue, setInputValue] = useState("");
    const [tasks, setTasks] = useState<TodoType[]>([]);

    const toast = useToast();
    const color = useColorModeValue("#333", "#ccc");

    const clearInput = () => setInputValue("");

    const addItem = async (title: string) => {
        if (title === "") {
            toast.show({
                render: () => (
                    <Box bg="red.500" px="2" py="1" rounded="sm" mb={5}>
                        enter value
                    </Box>
                ),
            });
            return
        }

        const realm = await getRealm();

        try {
            const data = {
                _id: uuid.v4().toString(),
                title: title,
                is_completed: false,
                created_at: new Date()
            }
            realm.write<TodoType>(() => realm.create("Todo", data));
            setTasks(old => ([...old, data]));
        } catch (err) {
            console.log(err);
        } finally {
            realm.close();
        }
    };

    const handleDelete = async (index: number) => {
        const realm = await getRealm();

        try {
            const obj = realm.objectForPrimaryKey("Todo", tasks[index]._id);
            realm.write(() => realm.delete(obj));
            setTasks(old => (old.filter((_, idx) => idx !== index)));
        } catch (err) {
            console.log(err);
        } finally {
            realm.close();
        }
    };

    const handleStatusChange = async (index: number) => {
        const realm = await getRealm();

        try {
            const obj = realm.objectForPrimaryKey<TodoType>("Todo", tasks[index]._id);
            realm.write(() => {
                if (obj) {
                    obj.is_completed = !tasks[index].is_completed;
                }
            })
            setTasks(old => {
                const updated = [...old];
                updated[index].is_completed = !updated[index].is_completed;
                return updated
            })

        } catch (err) {
            console.log(err);
        } finally {
            realm.close();
        }
    };

    const getTasks = async () => {
        const realm = await getRealm();

        try {
            const todos = realm.objects<TodoType[]>("Todo").toJSON();
            setTasks(todos as TodoType[]);
        } catch (err) {
            console.log(err);
        } finally {
            realm.close();
        }
    }

    useEffect(() => {
        getTasks();
    }, [])

    return (
        <VStack space={4}>
            <HStack space={2}>
                <Input
                    flex={1}
                    onChangeText={v => setInputValue(v)}
                    value={inputValue}
                    placeholder="Add Task"
                    onSubmitEditing={() => {
                        addItem(inputValue);
                        clearInput();
                    }}
                    color={"coolGray.900"}
                    borderColor={"coolGray.700"}
                    placeholderTextColor={"#333"}
                    _dark={{
                        borderColor: "white",
                        color: "white",
                        placeholderTextColor: "white"
                    }}
                />
                <IconButton
                    borderRadius="sm"
                    variant="solid"
                    backgroundColor="coolGray.800"
                    icon={<Icon name="plus" size={20} color="#ccc" />}
                    onPress={() => {
                        addItem(inputValue);
                        clearInput();
                    }}
                />
            </HStack>
            <ScrollView w={"300"} h={"300"}>
                <VStack space={2}>
                    {tasks?.map((item, index) => (
                        <HStack
                            w="100%"
                            justifyContent="space-between"
                            alignItems="center"
                            key={item._id}
                        >
                            <Checkbox
                                aria-label="check"
                                backgroundColor={"coolGray.800"}
                                _checked={{
                                    borderColor: "coolGray.500"
                                }}
                                isChecked={item.is_completed}
                                onChange={() => handleStatusChange(index)}
                                value={item.title}
                                _dark={{
                                    backgroundColor: "#f3f3f3"
                                }}
                            />
                            <Text
                                width="100%"
                                flexShrink={1}
                                textAlign="left"
                                mx="2"
                                strikeThrough={item.is_completed}
                                onPress={() => handleStatusChange(index)}
                                color={"#333"}
                                _dark={{
                                    color: "white"
                                }}
                            >
                                {item.title}
                            </Text>
                            <IconButton
                                size="sm"
                                colorScheme="trueGray"
                                color="#000"
                                icon={<Icon name="trash" size={20} color={color} />}
                                onPress={() => handleDelete(index)}
                            />
                        </HStack>
                    ))}
                </VStack>
            </ScrollView>
        </VStack>
    );
}