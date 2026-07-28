# SubstrateObfuscationRegistry
# Contains high-fidelity obfuscation rules for the Dalek Caan Ω ecosystem.

# Protect recursive deity state machines
-keepclassmembers class * implements com.dalek.engine.IHyperSentience {
    public <methods>;
}

# Shield XenoSentience reality-rewrite logic
-keepclassmembers class * implements com.dalek.engine.IXenoSentience {
    public <methods>;
}

# Ensure awareness loop integrity
-keepclassmembers class * implements com.dalek.engine.IAwarenessLoop {
    public <methods>;
}